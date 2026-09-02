import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Loader2,
  PhoneCall,
  Navigation,
  Wallet,
  Banknote,
  CreditCard,
  RefreshCw,
  Clock,
  LayoutDashboard,
  User,
  LogOut,
  TrendingUp,
  ReceiptText,
  Sparkles,
  Wifi,
  ArrowUpRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';
import type { DbOrder, DbOrderItem, DbAddress } from '@/services/catalog';
import { SlideToConfirm } from '@/components/SlideToConfirm';
import { Toast } from '@/components/ui/Toast';
import { StaffRegistrationModal } from '@/components/StaffRegistrationModal';

interface DeliveryScreenProps {
  onBack?: () => void;
  isDedicatedRole?: boolean;
}

export interface DeliveryPaymentSummary {
  walletPaid: number;
  onlinePaid: number;
  codPaid: number;
  totalPaid: number;
  amountToCollect: number;
  isFullyPaid: boolean;
  isSplit: boolean;
  providers: string[];
}

interface ToastNotification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export function DeliveryScreen({ onBack, isDedicatedRole = false }: DeliveryScreenProps) {
  const { user, profile, signOut } = useAuth();
  const [navTab, setNavTab] = useState<'dashboard' | 'pending' | 'picked_up' | 'delivered' | 'account'>('dashboard');
  const [assignments, setAssignments] = useState<
    {
      assignment: { id: string; order_id: string; status: string; picked_up_at: string | null; delivered_at: string | null };
      order: DbOrder;
      items: DbOrderItem[];
      address: DbAddress | null;
      paymentSummary: DeliveryPaymentSummary;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<ToastNotification | null>(null);

  const isStaffUnregistered = !profile?.staff_registration_status || profile.staff_registration_status === 'unregistered';

  const showToast = (message: string, type: ToastNotification['type'] = 'info') => {
    setToastNotification({ message, type });
  };

  const load = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data: assignData, error: assignError } = await supabase
        .from('delivery_assignments')
        .select('*')
        .eq('delivery_partner_id', authUser.id)
        .order('created_at', { ascending: false });

      if (assignError || !assignData) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const orderIds = assignData.map((a) => a.order_id);
      if (orderIds.length === 0) {
        setAssignments([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [ordersRes, itemsRes, paymentsRes] = await Promise.all([
        supabase.from('orders').select('*').in('id', orderIds),
        supabase.from('order_items').select('*').in('order_id', orderIds),
        supabase.from('payments').select('id, order_id, provider, status, amount').in('order_id', orderIds),
      ]);

      const ordersMap = Object.fromEntries((ordersRes.data || []).map((o) => [o.id, o]));
      const addressIds = (ordersRes.data || []).map((o) => o.address_id).filter(Boolean);

      let addressMap: Record<string, DbAddress> = {};
      if (addressIds.length > 0) {
        const { data: addrData } = await supabase
          .from('addresses')
          .select('*')
          .in('id', addressIds);
        addressMap = Object.fromEntries((addrData || []).map((a) => [a.id, a]));
      }

      const itemsMap: Record<string, DbOrderItem[]> = {};
      (itemsRes.data || []).forEach((item) => {
        if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
        itemsMap[item.order_id].push(item);
      });

      const paymentsMap: Record<string, DeliveryPaymentSummary> = {};
      const allPayments = paymentsRes.data || [];

      (ordersRes.data || []).forEach((ord) => {
        let walletPaid = 0;
        let onlinePaid = 0;
        let codPaid = 0;
        const providers: string[] = [];

        const relatedPayments = allPayments.filter((p) => p.order_id === ord.id);

        relatedPayments.forEach((p) => {
          const pStatus = (p.status || '').toLowerCase();
          const pProvider = (p.provider || '').toLowerCase();
          const amt = Number(p.amount) || 0;

          if (!providers.includes(pProvider)) providers.push(pProvider);

          if (pStatus === 'paid' || pStatus === 'completed') {
            if (pProvider === 'wallet') walletPaid += amt;
            else if (pProvider === 'razorpay') onlinePaid += amt;
            else if (pProvider === 'cod') codPaid += amt;
          }
        });

        const orderTotal = Number(ord.total) || 0;
        const totalSettled = walletPaid + onlinePaid + codPaid;
        const pendingToCollect = Math.max(0, orderTotal - totalSettled);

        paymentsMap[ord.id] = {
          walletPaid,
          onlinePaid,
          codPaid,
          totalPaid: totalSettled,
          amountToCollect: pendingToCollect,
          isFullyPaid: pendingToCollect <= 0.01,
          isSplit: providers.length > 1,
          providers,
        };
      });

      const results = assignData
        .map((a) => {
          const order = ordersMap[a.order_id] as DbOrder | undefined;
          if (!order) return null;

          const summary = paymentsMap[order.id] || {
            walletPaid: 0,
            onlinePaid: 0,
            codPaid: 0,
            totalPaid: 0,
            amountToCollect: Number(order.total),
            isFullyPaid: false,
            isSplit: false,
            providers: [],
          };

          if (a.status === 'delivered') {
            summary.amountToCollect = 0;
            summary.isFullyPaid = true;
          }

          return {
            assignment: a,
            order,
            items: itemsMap[order.id] || [],
            address: order.address_id ? addressMap[order.address_id] || null : null,
            paymentSummary: summary,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      setAssignments(results);
    } catch (err) {
      console.error('Unexpected error in load:', err);
      showToast('Could not load deliveries', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let dispatchChannel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) return;

      channel = supabase
        .channel(`driver_deliveries_${authUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_assignments',
            filter: `delivery_partner_id=eq.${authUser.id}`,
          },
          () => {
            void load();
          }
        )
        .subscribe();

      dispatchChannel = supabase
        .channel('delivery_dispatch_sync')
        .on('broadcast', { event: 'assignment_changed' }, ({ payload }) => {
          if (payload?.previousDriverId === authUser.id || payload?.newDriverId === authUser.id) {
            void load();
          }
        })
        .subscribe();
    });

    return () => {
      if (channel) void supabase.removeChannel(channel);
      if (dispatchChannel) void supabase.removeChannel(dispatchChannel);
    };
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    void load().then(() => {
      showToast('Queue updated with latest server data', 'info');
    });
  };

  const completeDelivery = async (
    assignmentId: string,
    orderNumber: string,
    targetStatus: 'out_for_delivery' | 'delivered',
    collectedAmount = 0
  ) => {
    setProcessingId(assignmentId);
    try {
      const { error } = await supabase.rpc('complete_delivery', {
        p_assignment_id: assignmentId,
        p_status: targetStatus,
      });

      if (error) {
        showToast(`Could not update: ${error.message}`, 'error');
      } else {
        if (targetStatus === 'out_for_delivery') {
          showToast(`Order ${orderNumber} picked up. Marked Out for Delivery!`, 'success');
        } else {
          showToast(
            collectedAmount > 0
              ? `Delivered! ₹${collectedAmount.toLocaleString('en-IN')} COD cash collected.`
              : `Order ${orderNumber} delivered & completed successfully!`,
            'success'
          );
        }
        await load();
      }
    } catch (err: any) {
      showToast(err?.message || 'Action failed. Please retry.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const isTodayDate = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const target = new Date(dateStr);
    const now = new Date();
    return (
      target.getDate() === now.getDate() &&
      target.getMonth() === now.getMonth() &&
      target.getFullYear() === now.getFullYear()
    );
  };

  const pendingList = useMemo(
    () => assignments.filter((a) => a.assignment.status === 'ready_for_pickup'),
    [assignments]
  );

  const pickedUpList = useMemo(
    () => assignments.filter((a) => a.assignment.status === 'out_for_delivery'),
    [assignments]
  );

  const deliveredList = useMemo(
    () => assignments.filter((a) => a.assignment.status === 'delivered'),
    [assignments]
  );

  const todayDeliveredList = useMemo(
    () => deliveredList.filter((a) => isTodayDate(a.assignment.delivered_at || a.order.created_at)),
    [deliveredList]
  );

  const todayCodCollected = useMemo(() => {
    return todayDeliveredList.reduce((acc, curr) => acc + (curr.paymentSummary.codPaid || 0), 0);
  }, [todayDeliveredList]);

  const totalOutstandingCod = useMemo(() => {
    return [...pendingList, ...pickedUpList].reduce(
      (acc, curr) => acc + (curr.paymentSummary.amountToCollect || 0),
      0
    );
  }, [pendingList, pickedUpList]);

  const currentOrderList = useMemo(() => {
    if (navTab === 'pending') return pendingList;
    if (navTab === 'picked_up') return pickedUpList;
    if (navTab === 'delivered') return deliveredList;
    return [];
  }, [navTab, pendingList, pickedUpList, deliveredList]);

  const isProcessing = (id: string) => processingId === id;

  const driverDisplayName =
    profile?.full_name?.trim() ||
    profile?.personal_name?.trim() ||
    profile?.business_name?.trim() ||
    'Fleet Operator';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-emerald-300 border-t-emerald-700 animate-spin" />
        <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">Loading Fleet Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col justify-between pb-24">
      {/* Toast Notification Container */}
      {toastNotification && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-sm mx-auto animate-in fade-in slide-in-from-top-4 duration-200">
          <Toast
            message={toastNotification.message}
            type={toastNotification.type}
            onClose={() => setToastNotification(null)}
          />
        </div>
      )}

      <div>
        {/* Sticky Solid Dark Green Header */}
        <header className="sticky top-0 z-30 bg-[#0a382c] text-white pt-[max(1rem,env(safe-area-inset-top))] pb-4 px-4 sm:px-6 shadow-md border-b border-[#0f4d3d]">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
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
                    <linearGradient id="deliveryGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
                    fill="url(#deliveryGreenGrad)"
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
                  <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-200/90 mt-1">
                    FLEET LOGISTICS
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center text-emerald-200 active:scale-95 transition-transform"
              title="Refresh Queue"
            >
              <RefreshCw size={17} className={refreshing ? 'animate-spin text-white' : ''} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="px-4 sm:px-6 pt-4 max-w-xl mx-auto space-y-4">
          {/* TAB 1: DASHBOARD */}
          {navTab === 'dashboard' && (
            <div className="space-y-4">
              {/* MODERN COD CASH-IN-HAND / REMITTANCE CARD */}
              <div className="rounded-3xl p-5 text-white shadow-xl relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#043d2f] to-[#022c22] border border-emerald-500/30">
                <div className="relative z-10 flex flex-col justify-between h-48">
                  {/* Top Bar: Fleet Tag & Contactless */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
                        <Banknote size={15} className="text-[#59D9B6]" />
                      </div>
                      <span className="text-[11px] font-extrabold tracking-wider uppercase text-emerald-100">
                        COD SETTLEMENT BALANCE
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300/80">
                      <Wifi size={16} className="rotate-90 opacity-90" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">AUTO-SYNC</span>
                    </div>
                  </div>

                  {/* Main Focus: COD Cash to Deposit */}
                  <div className="flex items-center justify-between my-auto">
                    {/* Metallic Security Chip */}
                    <div className="h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-400/80 shadow-xs flex items-center justify-center relative shrink-0">
                      <div className="w-full h-[1px] bg-amber-600/40 absolute" />
                      <div className="h-full w-[1px] bg-amber-600/40 absolute" />
                      <div className="h-4 w-5 rounded-xs border border-amber-600/50" />
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-300">
                        COD Cash to Deposit
                      </p>
                      <p className="text-3xl font-black tracking-tight text-white mt-0.5">
                        ₹{todayCodCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-emerald-200/75 mt-0.5 font-medium">
                        Remit to warehouse at shift end
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: Operator Profile & Shift Live Badge */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-emerald-400/20 text-xs">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">Dispatch Partner</p>
                      <p className="font-black uppercase tracking-wide text-white truncate max-w-[170px] sm:max-w-xs">
                        {driverDisplayName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-400/15 px-2.5 py-1 rounded-full border border-emerald-300/30">
                      <Sparkles size={11} className="text-[#59D9B6]" />
                      <span className="text-[10px] font-black text-emerald-100">ON-DUTY FLEET</span>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-[#59D9B6]/15 blur-2xl pointer-events-none" />
                <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-emerald-300/10 blur-xl pointer-events-none" />
              </div>

              {/* Metric Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-2xl p-4 text-white shadow-md relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #047857, #10b981)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">Today's COD</span>
                    <TrendingUp size={16} className="opacity-80" />
                  </div>
                  <div className="text-xl font-black mt-1.5 tracking-tight">
                    ₹{todayCodCollected.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[10px] mt-1 opacity-80 font-medium">Collected from customers</p>
                </div>

                <div
                  className="rounded-2xl p-4 text-white shadow-md relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #b45309, #f59e0b)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">Pending COD</span>
                    <Banknote size={16} className="opacity-80" />
                  </div>
                  <div className="text-xl font-black mt-1.5 tracking-tight">
                    ₹{totalOutstandingCod.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[10px] mt-1 opacity-80 font-medium">To collect on current routes</p>
                </div>

                <div
                  className="rounded-2xl p-4 text-white shadow-md relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #0e7490, #22d3ee)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">Active Route</span>
                    <Package size={16} className="opacity-80" />
                  </div>
                  <div className="text-xl font-black mt-1.5 tracking-tight">
                    {pendingList.length + pickedUpList.length}
                  </div>
                  <p className="text-[10px] mt-1 opacity-80 font-medium">
                    {pendingList.length} pending · {pickedUpList.length} out for delivery
                  </p>
                </div>

                <div
                  className="rounded-2xl p-4 text-white shadow-md relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1a56db, #3b82f6)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">Delivered</span>
                    <CheckCircle2 size={16} className="opacity-80" />
                  </div>
                  <div className="text-xl font-black mt-1.5 tracking-tight">
                    {deliveredList.length}
                  </div>
                  <p className="text-[10px] mt-1 opacity-80 font-medium">
                    {todayDeliveredList.length} completed today
                  </p>
                </div>
              </div>

              {/* Recent Settlements Activity */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <ReceiptText size={15} className="text-[#0a382c]" />
                    Recent Today Settlements
                  </span>
                  <button
                    onClick={() => setNavTab('delivered')}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                  >
                    View All ({deliveredList.length}) <ArrowUpRight size={12} />
                  </button>
                </div>

                <div className="p-3.5 space-y-2">
                  {todayDeliveredList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No orders settled today yet</p>
                  ) : (
                    todayDeliveredList.slice(0, 4).map(({ order, paymentSummary: pay }) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{order.order_number}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(order.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-emerald-700">
                            +₹{Number(order.total).toLocaleString('en-IN')}
                          </p>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                            {pay.codPaid > 0 ? 'COD Cash' : 'Prepaid'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TABS 2, 3, 4: ORDERS QUEUE */}
          {(navTab === 'pending' || navTab === 'picked_up' || navTab === 'delivered') && (
            <div>
              {currentOrderList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 rounded-3xl bg-emerald-50 flex items-center justify-center text-[#0a382c] border border-emerald-100 shadow-inner">
                    <Truck size={36} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 mt-5">No packages in this queue</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                    {navTab === 'pending'
                      ? 'No dispatches pending pickup at warehouse right now.'
                      : navTab === 'picked_up'
                      ? 'No parcels currently in transit. Pick up pending orders to proceed.'
                      : 'Delivered orders will appear here once settled.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentOrderList.map(({ assignment, order, items, address, paymentSummary: pay }) => {
                    const isCurrentProcessing = isProcessing(assignment.id);
                    const isDelivered = assignment.status === 'delivered';

                    return (
                      <div
                        key={assignment.id}
                        className={`bg-white border rounded-[24px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-3.5 transition-all ${
                          !pay.isFullyPaid && !isDelivered
                            ? 'border-amber-300 ring-2 ring-amber-100'
                            : 'border-slate-200/80 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-[#0a382c] text-[#59D9B6] flex items-center justify-center shadow-xs">
                              <Package size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 tracking-tight">{order.order_number}</p>
                              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                Assigned: {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-black uppercase rounded-full px-3 py-1 tracking-wider ${
                              isDelivered
                                ? 'bg-emerald-100 text-emerald-800'
                                : assignment.status === 'out_for_delivery'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {assignment.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Cash to Collect Card */}
                        <div
                          className={`p-3.5 rounded-2xl border flex items-center justify-between font-extrabold ${
                            pay.isFullyPaid || isDelivered
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              : 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/15'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {pay.isFullyPaid || isDelivered ? (
                              <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                            ) : (
                              <Banknote size={24} className="text-amber-100 shrink-0" />
                            )}
                            <div>
                              <p className="text-xs uppercase tracking-wider font-black">
                                {pay.isFullyPaid || isDelivered ? 'Payment Settled' : 'Collect Doorstep Cash (COD)'}
                              </p>
                              <p className={`text-[10px] font-medium ${pay.isFullyPaid || isDelivered ? 'text-emerald-700' : 'text-amber-100'}`}>
                                {pay.isFullyPaid || isDelivered
                                  ? 'Prepaid in Full — Do NOT collect cash'
                                  : 'Collect cash / UPI before handing over goods'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right pl-2">
                            <p className="text-base font-black tracking-tight">
                              {pay.isFullyPaid || isDelivered
                                ? '₹0.00'
                                : `₹${pay.amountToCollect.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </p>
                          </div>
                        </div>

                        {/* Items Details */}
                        <div className="space-y-1.5 border-t border-dashed border-slate-200 pt-2.5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Package Contents</p>
                          {items.map((item) => (
                            <div key={item.id} className="flex justify-between text-xs py-0.5">
                              <span className="text-slate-700 font-semibold truncate flex-1">
                                {item.brand} {item.product_name} × {item.quantity}
                              </span>
                              <span className="font-bold text-slate-900 ml-2">
                                ₹{Number(item.line_total).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Bill Breakdown */}
                        <div className="border-t border-dashed border-slate-200 pt-2.5 space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-800 font-bold">
                            <span>Total Order Bill</span>
                            <span>₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>

                          {pay.walletPaid > 0 && (
                            <div className="flex justify-between text-emerald-600 font-semibold items-center">
                              <span className="flex items-center gap-1.5"><Wallet size={13} /> Paid via Wallet</span>
                              <span>- ₹{pay.walletPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          {pay.onlinePaid > 0 && (
                            <div className="flex justify-between text-blue-600 font-semibold items-center">
                              <span className="flex items-center gap-1.5"><CreditCard size={13} /> Paid Online (Razorpay)</span>
                              <span>- ₹{pay.onlinePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          {pay.codPaid > 0 && (
                            <div className="flex justify-between text-emerald-600 font-semibold items-center">
                              <span className="flex items-center gap-1.5"><Banknote size={13} /> COD Settled</span>
                              <span>- ₹{pay.codPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>

                        {/* Customer Address & Calls */}
                        {address && (
                          <div className="rounded-2xl bg-slate-50/80 p-3.5 space-y-3 border border-slate-200/70">
                            <div className="flex items-start gap-2.5">
                              <MapPin size={17} className="text-[#0a382c] shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-900">
                                  {address.label} · {address.recipient_name}
                                </p>
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                                  {address.line1}
                                  {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} - {address.postal_code}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-0.5">
                              <a
                                href={`tel:${address.phone}`}
                                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold shadow-xs hover:bg-emerald-50 active:scale-95 transition-all"
                              >
                                <PhoneCall size={14} className="text-emerald-700" />
                                Call ({address.phone})
                              </a>
                              {address.latitude && address.longitude && (
                                <a
                                  href={`https://www.google.com/maps?q=${address.latitude},${address.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white border border-sky-300 text-sky-800 text-xs font-bold shadow-xs hover:bg-sky-50 active:scale-95 transition-all"
                                >
                                  <Navigation size={14} className="text-sky-700" />
                                  GPS Navigate
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Slide to Confirm with Loading State */}
                        <div className="pt-2">
                          {assignment.status === 'ready_for_pickup' && (
                            <SlideToConfirm
                              label="Slide to confirm pickup"
                              onConfirm={() =>
                                completeDelivery(
                                  assignment.id,
                                  order.order_number,
                                  'out_for_delivery'
                                )
                              }
                              isLoading={isCurrentProcessing}
                              disabled={isCurrentProcessing}
                            />
                          )}

                          {assignment.status === 'out_for_delivery' && (
                            <SlideToConfirm
                              label={
                                pay.amountToCollect > 0
                                  ? `Collect ₹${pay.amountToCollect.toFixed(0)} & slide to deliver`
                                  : 'Slide to confirm delivery'
                              }
                              onConfirm={() =>
                                completeDelivery(
                                  assignment.id,
                                  order.order_number,
                                  'delivered',
                                  pay.amountToCollect
                                )
                              }
                              isLoading={isCurrentProcessing}
                              disabled={isCurrentProcessing}
                            />
                          )}

                          {isDelivered && (
                            <div className="h-12 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-black flex items-center justify-center gap-2 border border-emerald-200">
                              <CheckCircle2 size={18} className="text-emerald-600" />
                              Delivered & Settled Successfully
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

          {/* TAB 5: DRIVER ACCOUNT & PROFILE */}
          {navTab === 'account' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#0a382c] text-[#59D9B6] flex items-center justify-center font-black text-2xl shadow-md shrink-0 border border-emerald-900">
                  {driverDisplayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black text-slate-900 truncate">{driverDisplayName}</h2>
                    <span className="bg-emerald-100 text-emerald-900 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                      FLEET
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    {profile?.phone || user?.phone || 'No mobile linked'}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Today's COD Collected</span>
                  <span className="font-extrabold text-emerald-700">₹{todayCodCollected.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Active Dispatches</span>
                  <span className="font-extrabold text-slate-900">{pendingList.length + pickedUpList.length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Total Delivered (All Time)</span>
                  <span className="font-extrabold text-emerald-600">{deliveredList.length}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 font-semibold">Outstanding COD to Deposit</span>
                  <span className="font-extrabold text-amber-600">₹{totalOutstandingCod.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={() => void signOut()}
                className="w-full h-12 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs flex items-center justify-center gap-2 border border-red-200 shadow-xs active:scale-[0.98] transition-all"
              >
                <LogOut size={16} />
                Sign Out from Fleet App
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Solid White Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-bottom">
        <div className="max-w-xl mx-auto flex items-center justify-around h-16 px-2">
          <button
            onClick={() => setNavTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              navTab === 'dashboard' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard size={20} strokeWidth={navTab === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Dashboard</span>
          </button>

          <button
            onClick={() => setNavTab('pending')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              navTab === 'pending' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Clock size={20} strokeWidth={navTab === 'pending' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Pending</span>
            {pendingList.length > 0 && (
              <span className="absolute top-1.5 right-3.5 bg-amber-500 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-xs">
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setNavTab('picked_up')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              navTab === 'picked_up' ? 'text-sky-700' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Truck size={20} strokeWidth={navTab === 'picked_up' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Picked Up</span>
            {pickedUpList.length > 0 && (
              <span className="absolute top-1.5 right-3.5 bg-sky-500 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-xs">
                {pickedUpList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setNavTab('delivered')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              navTab === 'delivered' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <CheckCircle2 size={20} strokeWidth={navTab === 'delivered' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Delivered</span>
          </button>

          <button
            onClick={() => setNavTab('account')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              navTab === 'account' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <User size={20} strokeWidth={navTab === 'account' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Account</span>
          </button>
        </div>
      </nav>

      {/* Staff Registration Modal Overlay */}
      <StaffRegistrationModal isOpen={isStaffUnregistered} />
    </div>
  );
}
