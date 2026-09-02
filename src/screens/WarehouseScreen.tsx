import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Package,
  Printer,
  Boxes,
  AlertTriangle,
  Minus,
  Plus,
  Save,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  Eye,
  X,
  FileText,
  Check,
  CheckCircle,
  XCircle,
  ChevronDown,
  Edit2,
  AlertCircle,
  RotateCcw,
  LogOut,
  Warehouse,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';
import type { DbOrder, DbOrderItem, DbAddress } from '@/services/catalog';
import { buildGstBillHtml } from '@/services/gstBill';
import { printHtml } from '@/utils/printHtml';
import { StaffRegistrationModal } from '@/components/StaffRegistrationModal';

interface WarehouseScreenProps {
  onBack?: () => void;
  isDedicatedRole?: boolean;
}

interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
}

interface ProductInventory {
  id: string;
  name: string;
  brand: string;
  pack_size: string;
  stock_quantity: number;
  stock_threshold: number;
  wholesale_price: number;
  mrp: number;
  image_url: string;
  is_available: boolean;
}

interface PaymentRecord {
  order_id: string;
  provider: string;
  amount: number;
  status: string;
}

interface PaymentSummary {
  walletPaid: number;
  onlinePaid: number;
  codPaid: number;
  totalPaid: number;
  amountDue: number;
  isFullyPaid: boolean;
  providers: string[];
}

export function WarehouseScreen({ onBack, isDedicatedRole = false }: WarehouseScreenProps) {
  const { signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices' | 'inventory' | 'low_stock'>('orders');
  const [orderStatusPill, setOrderStatusPill] = useState<string>('all');

  // Orders State
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [addressMap, setAddressMap] = useState<Record<string, DbAddress>>({});
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, { id: string; delivery_partner_id: string | null; status: string }>>({});
  const [paymentsMap, setPaymentsMap] = useState<Record<string, PaymentSummary>>({});
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [editingDriverOrderId, setEditingDriverOrderId] = useState<string | null>(null);

  // Inventory State
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  // Lazy Item Inspection State
  const [inspectOrderId, setInspectOrderId] = useState<string | null>(null);
  const [inspectItems, setInspectItems] = useState<DbOrderItem[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  // General Screen State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isStaffUnregistered = !profile?.staff_registration_status || profile.staff_registration_status === 'unregistered';

  const loadDrivers = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_delivery_partners');
      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error('Failed to load drivers via RPC:', err);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(150);

      if (ordersErr || !ordersData) return;

      setOrders(ordersData as DbOrder[]);

      const orderIds = ordersData.map((o) => o.id);
      const addressIds = ordersData.map((o) => o.address_id).filter(Boolean);

      const [addrRes, assignRes, paymentsRes] = await Promise.all([
        addressIds.length > 0
          ? supabase.from('addresses').select('*').in('id', addressIds)
          : Promise.resolve({ data: [] }),
        orderIds.length > 0
          ? supabase.from('delivery_assignments').select('id, order_id, delivery_partner_id, status').in('order_id', orderIds)
          : Promise.resolve({ data: [] }),
        orderIds.length > 0
          ? supabase.from('payments').select('order_id, provider, amount, status').in('order_id', orderIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (addrRes.data) {
        setAddressMap(Object.fromEntries(addrRes.data.map((a) => [a.id, a])));
      }

      if (assignRes.data) {
        const asgMap: Record<string, any> = {};
        assignRes.data.forEach((asg) => {
          asgMap[asg.order_id] = asg;
        });
        setAssignmentsMap(asgMap);
      }

      const paySummaries: Record<string, PaymentSummary> = {};
      const allPayments: PaymentRecord[] = (paymentsRes.data as PaymentRecord[]) || [];

      ordersData.forEach((ord) => {
        let walletPaid = 0;
        let onlinePaid = 0;
        let codPaid = 0;
        const providers: string[] = [];

        const orderPayments = allPayments.filter((p) => p.order_id === ord.id);

        orderPayments.forEach((p) => {
          const status = (p.status || '').toLowerCase();
          const provider = (p.provider || '').toLowerCase();
          const amt = Number(p.amount) || 0;

          if (!providers.includes(provider)) providers.push(provider);

          if (status === 'paid' || status === 'completed') {
            if (provider === 'wallet') walletPaid += amt;
            else if (provider === 'razorpay') onlinePaid += amt;
            else if (provider === 'cod') codPaid += amt;
          }
        });

        const total = Number(ord.total) || 0;
        const totalSettled = walletPaid + onlinePaid + codPaid;
        const pending = Math.max(0, total - totalSettled);

        paySummaries[ord.id] = {
          walletPaid,
          onlinePaid,
          codPaid,
          totalPaid: totalSettled,
          amountDue: ord.status === 'delivered' ? 0 : pending,
          isFullyPaid: ord.status === 'delivered' || pending <= 0.01,
          providers,
        };
      });

      setPaymentsMap(paySummaries);
    } catch (err) {
      console.error('Failed to load orders in warehouse:', err);
    }
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, pack_size, stock_quantity, stock_threshold, wholesale_price, mrp, image_url, is_available')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data as ProductInventory[]);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadDrivers(), loadOrders(), loadInventory()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadDrivers, loadOrders, loadInventory]);

  useEffect(() => {
    void loadAll();

    const channel = supabase
      .channel('warehouse_live_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          void loadOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_assignments' },
        () => {
          void loadOrders();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadAll, loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadAll();
  };

  const openItemInspection = async (orderId: string) => {
    setInspectOrderId(orderId);
    setInspectLoading(true);
    try {
      const { data } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      setInspectItems((data as DbOrderItem[]) || []);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    setActionOrderId(orderId);
    try {
      const { error } = await supabase.rpc('confirm_order', { p_order_id: orderId });
      if (error) alert('Could not confirm order: ' + error.message);
      else {
        await Promise.all([loadOrders(), loadInventory()]);
      }
    } finally {
      setActionOrderId(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setActionOrderId(orderId);
    try {
      const { error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_status: status,
      });
      if (error) alert('Status update failed: ' + error.message);
      else await loadOrders();
    } finally {
      setActionOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Stock will be preserved.')) return;
    setActionOrderId(orderId);
    try {
      const { error } = await supabase.rpc('cancel_order_warehouse', {
        p_order_id: orderId,
        p_reason: 'Cancelled by warehouse manager',
      });
      if (error) alert('Cancel failed: ' + error.message);
      else await Promise.all([loadOrders(), loadInventory()]);
    } finally {
      setActionOrderId(null);
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    setActionOrderId(orderId);
    const existing = assignmentsMap[orderId];
    const previousDriverId = existing?.delivery_partner_id || null;

    try {
      if (existing) {
        await supabase
          .from('delivery_assignments')
          .update({ delivery_partner_id: driverId || null, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else if (driverId) {
        await supabase
          .from('delivery_assignments')
          .insert({ order_id: orderId, delivery_partner_id: driverId, status: 'ready_for_pickup' });
      }

      const syncChannel = supabase.channel('delivery_dispatch_sync');
      await syncChannel.send({
        type: 'broadcast',
        event: 'assignment_changed',
        payload: { orderId, previousDriverId, newDriverId: driverId },
      });

      setEditingDriverOrderId(null);
      await loadOrders();
    } catch (err: any) {
      alert('Failed to assign driver: ' + err.message);
    } finally {
      setActionOrderId(null);
    }
  };

  const handlePrint = async (orderId: string, orderNumber: string) => {
    try {
      const html = await buildGstBillHtml(orderId);
      await printHtml(html, orderNumber);
    } catch (err) {
      alert('Failed to generate bill.');
    }
  };

  const handleStockDelta = (productId: string, currentStock: number, delta: number) => {
    const activeValue = stockEdits[productId] !== undefined ? stockEdits[productId] : currentStock;
    const nextVal = Math.max(0, activeValue + delta);
    setStockEdits((prev) => ({ ...prev, [productId]: nextVal }));
  };

  const handleStockInputChange = (productId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setStockEdits((prev) => ({ ...prev, [productId]: isNaN(parsed) ? 0 : Math.max(0, parsed) }));
  };

  const handleCancelStockEdit = (productId: string) => {
    setStockEdits((prev) => {
      const clone = { ...prev };
      delete clone[productId];
      return clone;
    });
  };

  const handleSaveStock = async (productId: string) => {
    const updatedQuantity = stockEdits[productId];
    if (updatedQuantity === undefined) return;

    setSavingStockId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: updatedQuantity, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) {
        alert('Failed to update stock: ' + error.message);
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock_quantity: updatedQuantity } : p))
        );
        handleCancelStockEdit(productId);
      }
    } finally {
      setSavingStockId(null);
    }
  };

  const orderPills = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'packed', label: 'Packed' },
    { id: 'ready_for_pickup', label: 'Ready for Pickup' },
    { id: 'out_for_delivery', label: 'Out for Delivery' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const recipient = o.address_id ? addressMap[o.address_id]?.recipient_name || '' : '';
      const orderNum = o.order_number || '';
      const matchesSearch =
        orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipient.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = orderStatusPill === 'all' || o.status === orderStatusPill;
      return matchesSearch && matchesStatus;
    });
  }, [orders, addressMap, searchQuery, orderStatusPill]);

  const invoiceOrders = useMemo(() => {
    return orders.filter((o) => {
      const recipient = o.address_id ? addressMap[o.address_id]?.recipient_name || '' : '';
      const orderNum = o.order_number || '';
      return (
        orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipient.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [orders, addressMap, searchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [products, searchQuery]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const isLow = p.stock_quantity <= (p.stock_threshold || 10);
      return (
        isLow &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col justify-between pb-28 md:pb-16">
      <div>
        {/* ============================================================ */}
        {/* STICKY SOLID DARK GREEN HEADER WITH DIRECT CAFKART LOGO      */}
        {/* ============================================================ */}
        <header className="sticky top-0 z-30 bg-[#0a382c] text-white pt-[max(1rem,env(safe-area-inset-top))] pb-4 px-4 sm:px-6 shadow-md border-b border-[#0f4d3d]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {!isDedicatedRole && onBack && (
                <button
                  onClick={onBack}
                  className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <ArrowLeft size={18} />
                </button>
              )}

              {/* Direct Enlarged Logo without container box or overlay tint */}
              <div className="flex items-center gap-3 select-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1536 1535"
                  className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 drop-shadow-sm"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="warehouseGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#59D9B6" />
                      <stop offset="100%" stopColor="#58D5A5" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z"
                    fill="#FFFFFF"
                    fillRule="evenodd"
                  />
                  <path
                    d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z"
                    fill="url(#warehouseGreenGrad)"
                    fillRule="evenodd"
                  />
                </svg>

                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-xl font-black tracking-tight text-white font-sans">Caf</span>
                    <span className="text-xl font-black tracking-tight text-[#59D9B6] font-sans">Kart</span>
                    <span className="ml-1 inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#59D9B6] border border-emerald-400/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#59D9B6] animate-pulse" />
                      ONLINE
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-200/90 mt-1">
                    WAREHOUSE FULFILLMENT
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center text-emerald-200 active:scale-95 transition-transform"
                title="Refresh Data"
              >
                <RefreshCw size={17} className={refreshing ? 'animate-spin text-white' : ''} />
              </button>

              {isDedicatedRole && (
                <button
                  onClick={() => void signOut()}
                  className="h-10 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-200 flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-transform"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="px-4 lg:px-8 pt-4 max-w-7xl mx-auto space-y-4">
          {/* DESKTOP TAB BAR & GLOBAL SEARCH */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Desktop Top Tabs Switcher - Hidden on mobile */}
            <div className="hidden md:grid grid-cols-4 gap-1 bg-slate-200/70 p-1 rounded-2xl w-auto">
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'orders' ? 'bg-white text-[#0a382c] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package size={15} />
                <span>Orders ({orders.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('invoices');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'invoices' ? 'bg-white text-[#0a382c] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={15} />
                <span>Invoices</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('inventory');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'inventory' ? 'bg-white text-[#0a382c] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes size={15} />
                <span>Inventory ({products.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('low_stock');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all relative ${
                  activeTab === 'low_stock' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle size={15} />
                <span>Low Stock</span>
                {lowStockProducts.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                    {lowStockProducts.length}
                  </span>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'orders' || activeTab === 'invoices'
                    ? 'Search order # or recipient...'
                    : 'Search brand or item...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-xs font-semibold outline-none focus:border-[#0a382c] shadow-xs transition"
              />
            </div>
          </div>

          {/* Orders Status Pills */}
          {activeTab === 'orders' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {orderPills.map((pill) => {
                const count =
                  pill.id === 'all' ? orders.length : orders.filter((o) => o.status === pill.id).length;
                const isActive = orderStatusPill === pill.id;

                return (
                  <button
                    key={pill.id}
                    onClick={() => setOrderStatusPill(pill.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#0a382c] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={36} className="animate-spin text-[#0a382c]" />
            </div>
          ) : (
            <>
              {/* TAB 1: ORDERS FULFILLMENT */}
              {activeTab === 'orders' && (
                <div>
                  {filteredOrders.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                      <Package size={40} className="mx-auto text-slate-300" />
                      <p className="font-bold text-sm text-slate-700">No orders matching criteria</p>
                      <p className="text-xs">Adjust your search query or status filter pill above.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredOrders.map((ord) => {
                        const addr = ord.address_id ? addressMap[ord.address_id] : null;
                        const asg = assignmentsMap[ord.id];
                        const pay = paymentsMap[ord.id] || {
                          walletPaid: 0,
                          onlinePaid: 0,
                          codPaid: 0,
                          totalPaid: 0,
                          amountDue: Number(ord.total),
                          isFullyPaid: false,
                          providers: [],
                        };
                        const isProcessing = actionOrderId === ord.id;
                        const isDelivered = ord.status === 'delivered';
                        const isCancelled = ord.status === 'cancelled';
                        const isReadyForPickup = ord.status === 'ready_for_pickup';
                        const assignedDriver = drivers.find((d) => d.id === asg?.delivery_partner_id);
                        const isEditingDriver = editingDriverOrderId === ord.id;

                        return (
                          <div
                            key={ord.id}
                            className={`bg-white border rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-3.5 flex flex-col justify-between transition-all ${
                              ord.status === 'pending'
                                ? 'border-amber-300 ring-1 ring-amber-100'
                                : isCancelled
                                ? 'border-red-200 bg-red-50/20'
                                : 'border-slate-200/80 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-slate-900 tracking-tight">
                                      {ord.order_number}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      {new Date(ord.created_at).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                                    {addr?.recipient_name || 'Commercial Customer'}
                                    {addr?.city ? ` · ${addr.city}` : ''}
                                  </p>
                                </div>

                                <span
                                  className={`text-[10px] font-black uppercase rounded-full px-2.5 py-1 ${
                                    isDelivered
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isReadyForPickup || ord.status === 'out_for_delivery'
                                      ? 'bg-sky-100 text-sky-800'
                                      : ord.status === 'packed'
                                      ? 'bg-amber-100 text-amber-800'
                                      : ord.status === 'confirmed'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : isCancelled
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-emerald-100 text-[#0a382c]'
                                  }`}
                                >
                                  {ord.status.replace(/_/g, ' ')}
                                </span>
                              </div>

                              <div
                                className={`p-3 rounded-xl border flex items-center justify-between font-bold text-xs ${
                                  pay.isFullyPaid || isDelivered
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                    : 'bg-amber-500 border-amber-600 text-white shadow-xs'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {pay.isFullyPaid || isDelivered ? (
                                    <CheckCircle size={17} className="text-emerald-600 shrink-0" />
                                  ) : (
                                    <AlertCircle size={18} className="text-amber-100 shrink-0" />
                                  )}
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wider font-extrabold">
                                      {pay.isFullyPaid || isDelivered
                                        ? 'Payment Settled (Prepaid)'
                                        : 'Pending Cash Collection (COD)'}
                                    </p>
                                    <p className={`text-[10px] ${pay.isFullyPaid || isDelivered ? 'text-emerald-700' : 'text-amber-100'}`}>
                                      {pay.walletPaid > 0 && `Wallet: ₹${pay.walletPaid.toFixed(0)} `}
                                      {pay.onlinePaid > 0 && `Online: ₹${pay.onlinePaid.toFixed(0)} `}
                                      {pay.codPaid > 0 && `COD: ₹${pay.codPaid.toFixed(0)} `}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm font-black">
                                    {pay.isFullyPaid || isDelivered
                                      ? `₹${Number(ord.total).toFixed(2)}`
                                      : `Collect ₹${pay.amountDue.toFixed(2)}`}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1">
                                <div>
                                  <span className="text-slate-400">Total: </span>
                                  <span className="font-extrabold text-slate-900">
                                    ₹{Number(ord.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <button
                                  onClick={() => void openItemInspection(ord.id)}
                                  className="flex items-center gap-1 text-[#0a382c] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold text-[11px] transition"
                                >
                                  <Eye size={12} /> View Items
                                </button>
                              </div>

                              {isReadyForPickup && (
                                <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                      <UserCheck size={14} className="text-[#0a382c]" /> Delivery Partner
                                    </span>
                                    {assignedDriver && !isEditingDriver && (
                                      <button
                                        onClick={() => setEditingDriverOrderId(ord.id)}
                                        className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 hover:underline"
                                      >
                                        <Edit2 size={11} /> Change Partner
                                      </button>
                                    )}
                                  </div>

                                  {!assignedDriver || isEditingDriver ? (
                                    <div className="relative">
                                      <select
                                        value={asg?.delivery_partner_id || ''}
                                        disabled={isProcessing}
                                        onChange={(e) => void handleAssignDriver(ord.id, e.target.value)}
                                        className="w-full h-9 pl-2.5 pr-8 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-[#0a382c] appearance-none shadow-xs"
                                      >
                                        <option value="">-- Choose Partner to Dispatch --</option>
                                        {drivers.map((d) => (
                                          <option key={d.id} value={d.id}>
                                            {d.name} {d.phone ? `(${d.phone})` : ''}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown
                                        size={14}
                                        className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2">
                                      <div>
                                        <p className="text-xs font-bold text-slate-900">{assignedDriver.name}</p>
                                        <p className="text-[10px] text-slate-400">{assignedDriver.phone}</p>
                                      </div>
                                      <span className="bg-sky-50 text-sky-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-sky-200">
                                        Assigned
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                              {ord.status === 'pending' && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => void handleConfirmOrder(ord.id)}
                                  className="flex-1 h-9 rounded-xl bg-[#0a382c] hover:bg-[#082d23] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                  Confirm & Deduct Stock
                                </button>
                              )}

                              {ord.status === 'confirmed' && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => void handleUpdateStatus(ord.id, 'packed')}
                                  className="flex-1 h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                                  Mark as Packed
                                </button>
                              )}

                              {ord.status === 'packed' && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => void handleUpdateStatus(ord.id, 'ready_for_pickup')}
                                  className="flex-1 h-9 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                  Ready for Dispatch
                                </button>
                              )}

                              {!isDelivered && !isCancelled && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => void handleCancelOrder(ord.id)}
                                  className="h-9 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 shadow-xs active:scale-98 transition"
                                >
                                  <XCircle size={14} /> Cancel
                                </button>
                              )}

                              <button
                                onClick={() => void handlePrint(ord.id, ord.order_number)}
                                className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-98 transition"
                              >
                                <Printer size={14} className="text-slate-600" /> Invoice
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INVOICES TAB */}
              {activeTab === 'invoices' && (
                <div>
                  {invoiceOrders.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                      <FileText size={40} className="mx-auto text-slate-300" />
                      <p className="font-bold text-sm text-slate-700">No invoices found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {invoiceOrders.map((ord) => {
                        const addr = ord.address_id ? addressMap[ord.address_id] : null;
                        return (
                          <div
                            key={ord.id}
                            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-slate-900">{ord.order_number}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 rounded-md bg-slate-100">
                                  {ord.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium mt-0.5">
                                {addr?.recipient_name} · {addr?.city}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Total: <span className="font-extrabold text-slate-800">₹{Number(ord.total).toLocaleString('en-IN')}</span> · GST: ₹{Number(ord.gst_amount || 0).toLocaleString('en-IN')}
                              </p>
                            </div>

                            <button
                              onClick={() => void handlePrint(ord.id, ord.order_number)}
                              className="h-9 px-3.5 rounded-xl bg-[#0a382c] hover:bg-[#082d23] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition shrink-0"
                            >
                              <Printer size={14} /> Print
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3 & 4: INVENTORY & LOW STOCK */}
              {(activeTab === 'inventory' || activeTab === 'low_stock') && (
                <div>
                  {(activeTab === 'inventory' ? filteredProducts : lowStockProducts).length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                      <Boxes size={40} className="mx-auto text-slate-300" />
                      <p className="font-bold text-sm text-slate-700">No items found</p>
                      <p className="text-xs">
                        {activeTab === 'low_stock'
                          ? 'All products are comfortably above their minimum threshold.'
                          : 'No inventory products match your search.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(activeTab === 'inventory' ? filteredProducts : lowStockProducts).map((prod) => {
                        const currentStock = prod.stock_quantity ?? 0;
                        const threshold = prod.stock_threshold || 10;
                        const isModified = stockEdits[prod.id] !== undefined;
                        const displayStock = isModified ? stockEdits[prod.id] : currentStock;
                        const isSaving = savingStockId === prod.id;
                        const isLow = currentStock <= threshold && currentStock > 0;
                        const isOut = currentStock <= 0;

                        return (
                          <div
                            key={prod.id}
                            className={`bg-white border rounded-2xl p-4 shadow-card space-y-3 flex flex-col justify-between transition-all ${
                              isOut
                                ? 'border-red-300 ring-1 ring-red-100'
                                : isLow
                                ? 'border-amber-300 ring-1 ring-amber-100'
                                : 'border-slate-200/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-black text-slate-900 truncate block">
                                  {prod.brand} {prod.name}
                                </span>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                  Pack: {prod.pack_size} · Wholesale: ₹{Number(prod.wholesale_price).toFixed(2)} · MRP: ₹{Number(prod.mrp).toFixed(2)}
                                </p>
                              </div>

                              <span
                                className={`text-[9px] font-black uppercase rounded-full px-2.5 py-1 shrink-0 ${
                                  isOut
                                    ? 'bg-red-100 text-red-800'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-400 font-semibold mr-1">Qty:</span>
                                <button
                                  onClick={() => handleStockDelta(prod.id, currentStock, -1)}
                                  className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition"
                                >
                                  <Minus size={13} />
                                </button>

                                <input
                                  type="number"
                                  value={displayStock}
                                  onChange={(e) => handleStockInputChange(prod.id, e.target.value)}
                                  className={`w-16 h-8 text-center text-xs font-black rounded-lg border outline-none ${
                                    isModified
                                      ? 'border-[#0a382c] bg-emerald-50/40 text-emerald-900 ring-1 ring-emerald-300'
                                      : 'border-slate-200 bg-white text-slate-900'
                                  }`}
                                />

                                <button
                                  onClick={() => handleStockDelta(prod.id, currentStock, 1)}
                                  className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition"
                                >
                                  <Plus size={13} />
                                </button>

                                <div className="flex items-center gap-1 ml-1">
                                  {[5, 10, 25].map((amt) => (
                                    <button
                                      key={amt}
                                      onClick={() => handleStockDelta(prod.id, currentStock, amt)}
                                      className="h-8 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200 active:scale-95 transition"
                                    >
                                      +{amt}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {isModified && (
                                <div className="flex items-center gap-1.5 ml-auto">
                                  <button
                                    onClick={() => handleCancelStockEdit(prod.id)}
                                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition"
                                  >
                                    <RotateCcw size={12} />
                                    Cancel
                                  </button>
                                  <button
                                    disabled={isSaving}
                                    onClick={() => void handleSaveStock(prod.id)}
                                    className="h-8 px-3 rounded-lg bg-[#0a382c] hover:bg-[#082d23] text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition disabled:opacity-50"
                                  >
                                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                    Update
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ============================================================ */}
      {/* SOLID WHITE BOTTOM NAVIGATION BAR (MOBILE ONLY)              */}
      {/* ============================================================ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-bottom md:hidden">
        <div className="max-w-xl mx-auto flex items-center justify-around h-16 px-1">
          <button
            onClick={() => {
              setActiveTab('orders');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              activeTab === 'orders' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Package size={20} strokeWidth={activeTab === 'orders' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Orders</span>
            {orders.length > 0 && (
              <span className="absolute top-1.5 right-3.5 bg-slate-900 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {orders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('invoices');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              activeTab === 'invoices' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <FileText size={20} strokeWidth={activeTab === 'invoices' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Invoices</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('inventory');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              activeTab === 'inventory' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Boxes size={20} strokeWidth={activeTab === 'inventory' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Inventory</span>
            {products.length > 0 && (
              <span className="absolute top-1.5 right-3.5 bg-slate-200 text-slate-800 text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {products.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('low_stock');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              activeTab === 'low_stock' ? 'text-red-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <AlertTriangle size={20} strokeWidth={activeTab === 'low_stock' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Low Stock</span>
            {lowStockProducts.length > 0 && (
              <span className="absolute top-1.5 right-3.5 bg-red-500 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center animate-pulse">
                {lowStockProducts.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Lazy Inspection Modal */}
      {inspectOrderId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">Package Contents</h3>
                <p className="text-[11px] text-slate-500">Inspect ordered line items before dispatch</p>
              </div>
              <button
                onClick={() => setInspectOrderId(null)}
                className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            {inspectLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 size={28} className="animate-spin text-[#0a382c]" />
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 divide-y divide-slate-50">
                {inspectItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs py-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-slate-900 truncate">
                        {item.brand} {item.product_name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {item.pack_size} · Qty: <span className="font-bold text-slate-700">{item.quantity}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900">
                        ₹{Number(item.line_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-400">₹{Number(item.unit_price).toFixed(2)} / unit</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setInspectOrderId(null)}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Staff Registration Modal Overlay */}
      <StaffRegistrationModal isOpen={isStaffUnregistered} />
    </div>
  );
}
