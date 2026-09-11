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
  EyeOff,
  X,
  FileText,
  Check,
  CheckCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Edit2,
  RotateCcw,
  LogOut,
  Wallet,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Truck,
  Sparkles,
  ArrowRight,
  Store,
  Layers,
  LayoutDashboard,
  Clock,
  CheckSquare,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Flame,
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

type InvoiceDatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const ORDERS_PER_PAGE = 12;
const INVOICES_PER_PAGE = 12;

// Exact CafKart Vector Logo
function CafKartLogo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1536 1535"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="ckWarehouseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#59D9B6" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <path
        d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z"
        fill="#FFFFFF"
        fillRule="evenodd"
      />
      <path
        d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z"
        fill="url(#ckWarehouseGrad)"
        fillRule="evenodd"
      />
    </svg>
  );
}

// 4. Futuristic High-Tech Warehouse Facility Vector SVG
function WarehouseFacilityGraphic({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 250 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="whBuildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d523f" />
          <stop offset="100%" stopColor="#04261c" />
        </linearGradient>
        <linearGradient id="whRoofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a6e50" />
          <stop offset="100%" stopColor="#0b4533" />
        </linearGradient>
        <linearGradient id="whGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#59D9B6" stopOpacity="0" />
          <stop offset="100%" stopColor="#59D9B6" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Ground Ambience Shadow */}
      <ellipse cx="155" cy="110" rx="82" ry="7" fill="#011912" fillOpacity="0.65" />

      {/* Distribution Center Building Structure */}
      <path
        d="M 68 44 L 140 20 L 212 44 L 212 96 L 68 96 Z"
        fill="url(#whBuildingGrad)"
        stroke="#1a6e50"
        strokeWidth="1.5"
      />

      {/* Overhanging Modern Canopy Roof */}
      <path
        d="M 62 44 L 140 18 L 218 44 L 140 50 Z"
        fill="url(#whRoofGrad)"
        stroke="#59D9B6"
        strokeWidth="1.2"
      />

      {/* Solar Panel Array Skylights */}
      <polygon points="100,32 135,22 135,28 100,38" fill="#59D9B6" fillOpacity="0.3" />
      <polygon points="145,22 180,32 180,38 145,28" fill="#59D9B6" fillOpacity="0.3" />

      {/* Loading Dock Bay 1 */}
      <rect x="80" y="56" width="34" height="40" rx="4" fill="#032117" stroke="#165c43" strokeWidth="1.5" />
      <line x1="80" y1="64" x2="114" y2="64" stroke="#0e4330" strokeWidth="1" />
      <line x1="80" y1="72" x2="114" y2="72" stroke="#0e4330" strokeWidth="1" />
      <line x1="80" y1="80" x2="114" y2="80" stroke="#0e4330" strokeWidth="1" />
      <line x1="80" y1="88" x2="114" y2="88" stroke="#0e4330" strokeWidth="1" />
      <rect x="94" y="52" width="6" height="2" rx="1" fill="#59D9B6" />

      {/* Loading Dock Bay 2 (With Staging Box) */}
      <rect x="123" y="56" width="34" height="40" rx="4" fill="#032117" stroke="#165c43" strokeWidth="1.5" />
      <line x1="123" y1="64" x2="157" y2="64" stroke="#0e4330" strokeWidth="1" />
      <line x1="123" y1="72" x2="157" y2="72" stroke="#0e4330" strokeWidth="1" />
      <line x1="123" y1="80" x2="157" y2="80" stroke="#0e4330" strokeWidth="1" />
      <line x1="123" y1="88" x2="157" y2="88" stroke="#0e4330" strokeWidth="1" />
      <rect x="137" y="52" width="6" height="2" rx="1" fill="#59D9B6" />

      {/* Loading Dock Bay 3 */}
      <rect x="166" y="56" width="34" height="40" rx="4" fill="#032117" stroke="#165c43" strokeWidth="1.5" />
      <line x1="166" y1="64" x2="200" y2="64" stroke="#0e4330" strokeWidth="1" />
      <line x1="166" y1="72" x2="200" y2="72" stroke="#0e4330" strokeWidth="1" />
      <line x1="166" y1="80" x2="200" y2="80" stroke="#0e4330" strokeWidth="1" />
      <line x1="166" y1="88" x2="200" y2="88" stroke="#0e4330" strokeWidth="1" />
      <rect x="180" y="52" width="6" height="2" rx="1" fill="#59D9B6" />

      {/* Pallet Stacks */}
      <g transform="translate(42, 74)">
        <rect x="0" y="8" width="22" height="14" rx="2" fill="#d97706" stroke="#f59e0b" strokeWidth="1" />
        <line x1="11" y1="8" x2="11" y2="22" stroke="#b45309" strokeWidth="1" />
        <rect x="3" y="0" width="16" height="9" rx="1.5" fill="#f59e0b" />
      </g>

      {/* Autonomous Forklift & Pallet Crane */}
      <g transform="translate(15, 80)">
        <rect x="4" y="6" width="14" height="10" rx="2" fill="#FFFFFF" />
        <rect x="0" y="10" width="5" height="6" fill="#FFFFFF" />
        <line x1="18" y1="2" x2="18" y2="16" stroke="#59D9B6" strokeWidth="2" />
        <line x1="18" y1="14" x2="24" y2="14" stroke="#59D9B6" strokeWidth="2" />
        <circle cx="6" cy="16" r="3" fill="#0f172a" />
        <circle cx="15" cy="16" r="3" fill="#0f172a" />
      </g>

      {/* Hub Central Logo Mark */}
      <circle cx="140" cy="38" r="9" fill="#032117" stroke="#59D9B6" strokeWidth="1.2" />
      <path d="M 137 38 L 139 36 L 144 41" stroke="#59D9B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Live Hub Radar Signal */}
      <g transform="translate(216, 20)">
        <circle cx="8" cy="8" r="7.5" fill="#063a2c" stroke="#59D9B6" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="3" fill="#59D9B6" />
        <line x1="8" y1="12" x2="8" y2="17" stroke="#59D9B6" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function WarehouseScreen({ onBack, isDedicatedRole = false }: WarehouseScreenProps) {
  const { logout, profile } = useAuth();
  // 1. Added 'dashboard' as default active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'invoices' | 'inventory' | 'low_stock'>('dashboard');
  const [orderStatusPill, setOrderStatusPill] = useState<string>('all');

  // Pagination States
  const [ordersPage, setOrdersPage] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(1);

  // Invoice Date Filter States
  const [invoiceDatePreset, setInvoiceDatePreset] = useState<InvoiceDatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Orders State
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [addressMap, setAddressMap] = useState<Record<string, DbAddress>>({});
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, { id: string; delivery_partner_id: string | null; status: string }>>({});
  const [paymentsMap, setPaymentsMap] = useState<Record<string, PaymentSummary>>({});
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [editingDriverOrderId, setEditingDriverOrderId] = useState<string | null>(null);

  // Selected driver per order in assign_partner tab
  const [driverSelections, setDriverSelections] = useState<Record<string, string>>({});

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

  // Per-order inline expandable items toggle
  const [expandedOrderItems, setExpandedOrderItems] = useState<Record<string, boolean>>({});

  const toggleOrderInlineItems = async (orderId: string) => {
    const isCurrentlyExpanded = !!expandedOrderItems[orderId];
    if (!isCurrentlyExpanded && inspectOrderId !== orderId) {
      void openItemInspection(orderId);
    }
    setExpandedOrderItems((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

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
        .limit(250);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void loadOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_assignments' }, () => {
        void loadOrders();
      })
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
      const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId);
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

  // 3. Assign Partner & automatically transition order to 'ready_for_pickup'
  const handleAssignDriver = async (orderId: string, driverId: string) => {
    if (!driverId) {
      alert('Please choose a delivery partner to dispatch.');
      return;
    }
    setActionOrderId(orderId);
    const existing = assignmentsMap[orderId];
    const previousDriverId = existing?.delivery_partner_id || null;

    try {
      if (existing) {
        await supabase
          .from('delivery_assignments')
          .update({
            delivery_partner_id: driverId,
            status: 'ready_for_pickup',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('delivery_assignments').insert({
          order_id: orderId,
          delivery_partner_id: driverId,
          status: 'ready_for_pickup',
        });
      }

      // Move order status from 'packed' to 'ready_for_pickup'
      await supabase
        .from('orders')
        .update({ status: 'ready_for_pickup', updated_at: new Date().toISOString() })
        .eq('id', orderId);

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

  // 3. Updated Order Stage Navigation Pills
  const orderPills = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'assign_partner', label: 'Assign Partner' },
    { id: 'ready_for_pickup', label: 'Ready for Pickup' },
    { id: 'out_for_delivery', label: 'Out for Delivery' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    setOrdersPage(1);
  }, [searchQuery, orderStatusPill]);

  useEffect(() => {
    setInvoicesPage(1);
  }, [searchQuery, invoiceDatePreset, customStartDate, customEndDate]);

  // 3. Filter orders based on the new 'assign_partner' stage
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const recipient = o.address_id ? addressMap[o.address_id]?.recipient_name || '' : '';
      const orderNum = o.order_number || '';
      const matchesSearch =
        orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipient.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStatus = true;
      if (orderStatusPill === 'assign_partner') {
        matchesStatus = o.status === 'packed';
      } else if (orderStatusPill !== 'all') {
        matchesStatus = o.status === orderStatusPill;
      }

      return matchesSearch && matchesStatus;
    });
  }, [orders, addressMap, searchQuery, orderStatusPill]);

  const totalOrderPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, ordersPage]);

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayMidnight = new Date(todayMidnight);
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);

    const sevenDaysAgo = new Date(todayMidnight);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const thirtyDaysAgo = new Date(todayMidnight);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    return orders.filter((ord) => {
      const recipient = ord.address_id ? addressMap[ord.address_id]?.recipient_name || '' : '';
      const orderNum = ord.order_number || '';
      const matchesSearch =
        orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipient.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const ordDate = new Date(ord.created_at);

      if (invoiceDatePreset === 'all') return true;
      if (invoiceDatePreset === 'today') return ordDate >= todayMidnight;
      if (invoiceDatePreset === 'yesterday') return ordDate >= yesterdayMidnight && ordDate < todayMidnight;
      if (invoiceDatePreset === 'week') return ordDate >= sevenDaysAgo;
      if (invoiceDatePreset === 'month') return ordDate >= thirtyDaysAgo;

      if (invoiceDatePreset === 'custom') {
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : new Date(0);
        const end = customEndDate ? new Date(`${customEndDate}T23:59:59`) : new Date();
        return ordDate >= start && ordDate <= end;
      }

      return true;
    });
  }, [orders, addressMap, searchQuery, invoiceDatePreset, customStartDate, customEndDate]);

  const totalInvoicePages = Math.ceil(filteredInvoices.length / INVOICES_PER_PAGE) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (invoicesPage - 1) * INVOICES_PER_PAGE;
    return filteredInvoices.slice(start, start + INVOICES_PER_PAGE);
  }, [filteredInvoices, invoicesPage]);

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

  // Warehouse Operational Metrics
  const metrics = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length;
    const confirmed = orders.filter((o) => o.status === 'confirmed').length;
    const packed = orders.filter((o) => o.status === 'packed').length;
    const ready = orders.filter((o) => o.status === 'ready_for_pickup').length;
    const out = orders.filter((o) => o.status === 'out_for_delivery').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

    return { pending, confirmed, packed, ready, out, delivered, totalRevenue };
  }, [orders]);

  const managerDisplayName =
    profile?.full_name?.trim() ||
    profile?.personal_name?.trim() ||
    profile?.business_name?.trim() ||
    'Warehouse Manager';

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex flex-col justify-between pb-28 md:pb-16">
      <div>
        {/* COMPACT STICKY HEADER WITH CAFKART LOGO & WAREHOUSE FACILITY GRAPHIC */}
        <header className="sticky top-0 z-40 bg-gradient-to-b from-[#063a2c] via-[#084534] to-[#0a4d3b] text-white pt-[max(0.4rem,env(safe-area-inset-top))] pb-2.5 px-4 sm:px-6 shadow-md rounded-b-[26px] border-b border-[#0d5944] overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-2">
            {/* Left Column: Logo + Manager Greeting */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 select-none">
                {!isDedicatedRole && onBack && (
                  <button
                    onClick={onBack}
                    className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white active:scale-95 transition-transform shrink-0"
                  >
                    <ArrowLeft size={14} />
                  </button>
                )}

                <CafKartLogo className="h-7 w-7 shrink-0 drop-shadow-xs" />
                <div className="flex items-baseline gap-1 leading-none">
                  <span className="text-base font-black tracking-tight text-white">Caf</span>
                  <span className="text-base font-black tracking-tight text-[#59D9B6]">Kart</span>
                  <span className="text-[7.5px] font-black uppercase tracking-[0.16em] text-emerald-300/80 ml-1">
                    WAREHOUSE
                  </span>
                </div>
              </div>

              <div className="mt-1">
                <p className="text-[10.5px] font-medium text-emerald-200/90 leading-tight">
                  {timeGreeting},
                </p>
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate leading-tight mt-0.5">
                  {managerDisplayName}
                </h1>
                <p className="text-[9.5px] font-medium text-emerald-300/80 leading-tight flex items-center gap-1 mt-0.5">
                  Fulfillment & Dispatch Command Center 📦
                </p>
              </div>
            </div>

            {/* Right Column: Online pill, actions & custom Warehouse SVG */}
            <div className="flex flex-col items-end shrink-0 w-[46%] max-w-[190px]">
              <div className="flex items-center gap-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#59D9B6] border border-emerald-400/30 text-[9.5px] font-black tracking-wide">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#59D9B6] animate-pulse" />
                  ONLINE
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-6 w-6 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center text-emerald-200 active:scale-95 transition-transform"
                  title="Refresh Queue"
                >
                  <RefreshCw size={12} className={refreshing ? 'animate-spin text-white' : ''} />
                </button>

                {isDedicatedRole && (
                  <button
                    onClick={() => void logout({ scope: 'local' })}
                    className="h-6 px-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-200 flex items-center gap-1 text-[10px] font-bold active:scale-95 transition-transform"
                    title="Sign Out"
                  >
                    <LogOut size={11} />
                    <span className="hidden sm:inline">Exit</span>
                  </button>
                )}
              </div>

              {/* 4. Beautiful Warehouse SVG Graphic */}
              <div className="w-full -mr-2 -mt-1 scale-105 origin-top-right transition-transform pointer-events-none">
                <WarehouseFacilityGraphic className="w-full h-auto drop-shadow-md" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="px-4 lg:px-8 pt-4 max-w-7xl mx-auto space-y-4">
          {/* Top Control Bar: Desktop Switcher & 6. Themed Modern Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Desktop Switcher */}
            <div className="hidden md:flex items-center gap-1 bg-slate-200/70 p-1 rounded-2xl w-auto">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
                { id: 'invoices', label: 'Invoices', icon: FileText },
                { id: 'inventory', label: `Inventory (${products.length})`, icon: Boxes },
                { id: 'low_stock', label: 'Low Stock', icon: AlertTriangle, count: lowStockProducts.length },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setSearchQuery('');
                    }}
                    className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-black transition-all ${
                      isActive ? 'bg-[#0a382c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 6. Themed, High-Impact Search Bar */}
            {activeTab !== 'dashboard' && (
              <div className="relative w-full md:w-80 group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#59D9B6]/20 to-emerald-500/10 rounded-2xl blur-xs -z-10 group-focus-within:from-[#59D9B6]/30 group-focus-within:to-emerald-500/25 transition-all" />
                <div className="relative flex items-center bg-white border border-emerald-900/15 rounded-2xl shadow-xs transition-all duration-200 focus-within:border-[#0a382c] focus-within:ring-2 focus-within:ring-[#59D9B6]/40">
                  <div className="pl-3.5 pr-1 flex items-center justify-center text-[#0a382c]">
                    <Search size={16} strokeWidth={2.5} />
                  </div>
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'orders' || activeTab === 'invoices'
                        ? 'Search order # or recipient...'
                        : 'Search brand or inventory item...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 py-2 px-2 bg-transparent text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mr-2.5 h-6 w-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition active:scale-90"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 1 & 5. TAB 1: PROFESSIONAL OPTIMIZED WAREHOUSE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Distribution Hub Operations Overview Card */}
              <div className="rounded-[26px] p-5 text-white shadow-xl relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#094736] to-[#042c22] border border-emerald-500/30">
                <div className="relative z-10 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider text-emerald-100">
                      <ShieldCheck size={14} className="text-[#59D9B6]" />
                      Central Dispatch Hub
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300/90 text-[10px] font-bold">
                      <Wifi size={13} className="rotate-90" />
                      <span>LIVE DISPATCH ENGINE</span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                        Total Order Volume Processed
                      </p>
                      <p className="text-3xl font-black tracking-tight text-white mt-0.5">
                        ₹{metrics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-3 py-1 rounded-full">
                        {orders.length} TOTAL RUNS
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-emerald-500/20 text-xs">
                    <p className="text-[11px] text-emerald-200/80 font-medium">
                      {metrics.pending > 0
                        ? `⚠️ ${metrics.pending} pending orders require immediate confirmation!`
                        : 'All new orders confirmed. Staging line is operating on schedule.'}
                    </p>
                    <div className="flex items-center gap-1 text-[#59D9B6] text-[10px] font-black">
                      <Sparkles size={12} /> DOCK SYNCHRONIZED
                    </div>
                  </div>
                </div>

                <div className="absolute -right-8 -bottom-8 h-44 w-44 rounded-full bg-[#59D9B6]/15 blur-2xl pointer-events-none" />
              </div>

              {/* 5. Modern Fintech Pipeline Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. New Orders */}
                <div
                  onClick={() => {
                    setActiveTab('orders');
                    setOrderStatusPill('pending');
                  }}
                  className="bg-white border border-slate-200/80 rounded-[22px] p-4 shadow-sm space-y-1 hover:border-amber-300 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">New Inflow</span>
                    <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                      <Clock size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.pending}</p>
                  <p className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                    Needs Confirmation <ArrowRight size={11} />
                  </p>
                </div>

                {/* 2. Packing Queue */}
                <div
                  onClick={() => {
                    setActiveTab('orders');
                    setOrderStatusPill('confirmed');
                  }}
                  className="bg-white border border-slate-200/80 rounded-[22px] p-4 shadow-sm space-y-1 hover:border-blue-300 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Packing Line</span>
                    <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
                      <Package size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.confirmed}</p>
                  <p className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
                    In Packing <ArrowRight size={11} />
                  </p>
                </div>

                {/* 3. Assign Partner (Stage between Packed and Ready) */}
                <div
                  onClick={() => {
                    setActiveTab('orders');
                    setOrderStatusPill('assign_partner');
                  }}
                  className={`bg-white border rounded-[22px] p-4 shadow-sm space-y-1 cursor-pointer transition-all active:scale-[0.98] ${
                    metrics.packed > 0
                      ? 'border-emerald-500 ring-2 ring-emerald-100/70'
                      : 'border-slate-200/80 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assign Partner</span>
                    <div className="h-7 w-7 rounded-xl bg-emerald-50 text-[#0a382c] flex items-center justify-center border border-emerald-200/60">
                      <UserCheck size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.packed}</p>
                  <p className="text-[10px] text-emerald-800 font-black flex items-center gap-1">
                    Packed · Awaiting Driver <ArrowRight size={11} />
                  </p>
                </div>

                {/* 4. Ready for Driver Pickup */}
                <div
                  onClick={() => {
                    setActiveTab('orders');
                    setOrderStatusPill('ready_for_pickup');
                  }}
                  className="bg-white border border-slate-200/80 rounded-[22px] p-4 shadow-sm space-y-1 hover:border-sky-300 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dock Staging</span>
                    <div className="h-7 w-7 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200/60">
                      <Truck size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.ready}</p>
                  <p className="text-[10px] text-sky-700 font-bold flex items-center gap-1">
                    Ready for Pickup <ArrowRight size={11} />
                  </p>
                </div>
              </div>

              {/* Priority Action Orders Alert */}
              <div className="bg-white border border-slate-200/80 rounded-[26px] p-4 sm:p-5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                      <Flame size={16} />
                    </div>
                    <span className="text-xs font-black text-slate-900">Priority Orders Awaiting Action</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-0.5"
                  >
                    View All Queues <ChevronRight size={14} />
                  </button>
                </div>

                {orders.filter((o) => o.status === 'pending' || o.status === 'packed').length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    🎉 Outstanding work! No urgent bottlenecks in the warehouse pipeline.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders
                      .filter((o) => o.status === 'pending' || o.status === 'packed')
                      .slice(0, 4)
                      .map((ord) => {
                        const addr = ord.address_id ? addressMap[ord.address_id] : null;
                        const isPending = ord.status === 'pending';
                        return (
                          <div key={ord.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900">{ord.order_number}</span>
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                                    isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-900'
                                  }`}
                                >
                                  {isPending ? 'Needs Confirm' : 'Needs Driver'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {addr?.recipient_name} · ₹{Number(ord.total).toFixed(2)}
                              </p>
                            </div>

                            {isPending ? (
                              <button
                                onClick={() => void handleConfirmOrder(ord.id)}
                                className="px-3.5 py-1.5 rounded-full bg-[#0a382c] hover:bg-[#082d23] text-white text-xs font-black shrink-0 active:scale-95 transition"
                              >
                                Confirm
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveTab('orders');
                                  setOrderStatusPill('assign_partner');
                                }}
                                className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shrink-0 active:scale-95 transition"
                              >
                                Assign Driver
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Inventory Health & Low Stock Warning */}
              <div className="bg-white border border-slate-200/80 rounded-[26px] p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes size={18} className="text-[#0a382c]" />
                    <span className="text-xs font-black text-slate-900">Inventory Health Status</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('low_stock')}
                    className="text-xs font-bold text-red-600 hover:underline flex items-center gap-0.5"
                  >
                    Inspect Low Stock ({lowStockProducts.length}) <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3 text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase">Total Catalog SKUs</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{products.length}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200/70 rounded-2xl p-3 text-center">
                    <p className="text-xs font-bold text-red-600 uppercase">Below Threshold</p>
                    <p className="text-xl font-black text-red-700 mt-1">{lowStockProducts.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Filter Status Pills (When in Orders Tab) */}
          {activeTab === 'orders' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {orderPills.map((pill) => {
                let count = 0;
                if (pill.id === 'all') count = orders.length;
                else if (pill.id === 'assign_partner') count = orders.filter((o) => o.status === 'packed').length;
                else count = orders.filter((o) => o.status === pill.id).length;

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
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
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

          {/* Invoices Tab Period Filter */}
          {activeTab === 'invoices' && (
            <div className="bg-white border border-slate-200/80 rounded-[22px] p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Filter size={14} className="text-[#0a382c]" /> Filter Invoices by Period
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'week', label: 'Last 7 Days' },
                  { id: 'month', label: 'This Month' },
                  { id: 'custom', label: 'Custom' },
                ].map((preset) => {
                  const isActive = invoiceDatePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setInvoiceDatePreset(preset.id as InvoiceDatePreset)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#0a382c] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {invoiceDatePreset === 'custom' && (
                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 w-12 shrink-0">From:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-[#0a382c]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 w-12 shrink-0">To:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-[#0a382c]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={36} className="animate-spin text-[#0a382c]" />
            </div>
          ) : (
            <>
              {/* TAB 2: ORDERS FULFILLMENT WITH 'ASSIGN PARTNER' LIFECYCLE STAGE */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-[26px] p-12 text-center text-slate-400 space-y-2">
                      <Package size={40} className="mx-auto text-slate-300" />
                      <p className="font-bold text-sm text-slate-700">No orders matching filter</p>
                      <p className="text-xs">Adjust your search query or status filter pill above.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {paginatedOrders.map((ord) => {
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
                        const isPacked = ord.status === 'packed';
                        const isReadyForPickup = ord.status === 'ready_for_pickup';
                        const assignedDriver = drivers.find((d) => d.id === asg?.delivery_partner_id);
                        const isEditingDriver = editingDriverOrderId === ord.id;

                        const hasPendingCash = !pay.isFullyPaid && !isDelivered && pay.amountDue > 0;
                        const isInlineExpanded = !!expandedOrderItems[ord.id];

                        return (
                          <div
                            key={ord.id}
                            className={`bg-white border rounded-[26px] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-3.5 flex flex-col justify-between transition-all ${
                              isPacked
                                ? 'border-emerald-400 ring-2 ring-emerald-100/70'
                                : hasPendingCash
                                ? 'border-amber-300 hover:border-amber-400'
                                : isCancelled
                                ? 'border-red-200 bg-red-50/10'
                                : 'border-slate-200/80 hover:border-emerald-200'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Order Card Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-2xl bg-[#0a382c] text-[#59D9B6] flex items-center justify-center shadow-xs">
                                    <Package size={18} strokeWidth={2.2} />
                                  </div>
                                  <div>
                                    <span className="text-sm font-black text-slate-900 tracking-tight">
                                      {ord.order_number}
                                    </span>
                                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                      {new Date(ord.created_at).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`text-[9.5px] font-black uppercase rounded-full px-3 py-1 tracking-wider inline-flex items-center gap-1.5 ${
                                    isDelivered
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : isReadyForPickup || ord.status === 'out_for_delivery'
                                      ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                      : isPacked
                                      ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold'
                                      : ord.status === 'confirmed'
                                      ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                      : isCancelled
                                      ? 'bg-red-50 text-red-800 border border-red-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      isDelivered
                                        ? 'bg-emerald-600'
                                        : isCancelled
                                        ? 'bg-red-600'
                                        : isPacked
                                        ? 'bg-emerald-700 animate-pulse'
                                        : 'bg-amber-600'
                                    }`}
                                  />
                                  {isPacked ? 'PACKED (AWAITING DRIVER)' : ord.status.replace(/_/g, ' ')}
                                </span>
                              </div>

                              {/* Doorstep Cash Collection Card */}
                              <div className="relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-r from-[#0a4d3a] to-[#0e634b] text-white shadow-sm border border-emerald-600/30">
                                <div className="flex items-center justify-between relative z-10">
                                  <div className="flex items-start gap-2.5">
                                    <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                                      <Wallet size={18} className="text-[#59D9B6]" />
                                    </div>
                                    <div>
                                      <p className="text-xs uppercase tracking-wider font-black text-white">
                                        {hasPendingCash ? 'Collect Doorstep Cash (COD)' : 'Payment Settled'}
                                      </p>
                                      <p className="text-[10px] text-emerald-200/90 font-medium mt-0.5">
                                        {hasPendingCash
                                          ? 'Driver must collect cash before handover'
                                          : 'Prepaid in Full · No doorstep cash required'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-right shrink-0">
                                    <p className="text-sm font-black tracking-tight text-white">
                                      {hasPendingCash
                                        ? `₹${pay.amountDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : '₹0.00'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Package Items with Eye Button Toggle */}
                              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-800">Package Contents</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => void toggleOrderInlineItems(ord.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-emerald-300 text-[11px] font-black text-emerald-800 shadow-2xs active:scale-95 transition-all"
                                  >
                                    {isInlineExpanded ? (
                                      <>
                                        <EyeOff size={13} className="text-slate-500" />
                                        <span>Hide Items</span>
                                      </>
                                    ) : (
                                      <>
                                        <Eye size={13} className="text-emerald-600" />
                                        <span>View Items</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                {isInlineExpanded && inspectOrderId === ord.id ? (
                                  <div className="divide-y divide-slate-100 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                    {inspectLoading ? (
                                      <div className="py-3 flex justify-center">
                                        <Loader2 size={16} className="animate-spin text-emerald-700" />
                                      </div>
                                    ) : (
                                      inspectItems.map((it) => (
                                        <div key={it.id} className="flex justify-between items-center text-xs py-1.5">
                                          <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <span className="h-5 w-5 rounded-md bg-emerald-50 text-[#0a382c] font-black text-[9px] flex items-center justify-center shrink-0 border border-emerald-200">
                                              ×{it.quantity}
                                            </span>
                                            <span className="text-slate-700 font-semibold truncate">
                                              {it.brand ? `${it.brand} ` : ''}{it.product_name}
                                            </span>
                                          </div>
                                          <span className="font-black text-slate-900 whitespace-nowrap">
                                            ₹{Number(it.line_total).toLocaleString('en-IN')}
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                ) : null}

                                <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center text-xs font-black">
                                  <span className="text-slate-600 flex items-center gap-1.5">
                                    <Banknote size={14} className="text-emerald-700" /> Total Order Bill
                                  </span>
                                  <span className="text-emerald-800 text-sm font-black">
                                    ₹{Number(ord.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>

                              {/* Customer Location Card */}
                              {addr && (
                                <div className="rounded-2xl bg-white border border-slate-200/90 p-3 space-y-1.5 shadow-2xs">
                                  <div className="flex items-start gap-2.5">
                                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#0a382c] flex items-center justify-center shrink-0 border border-emerald-200/60 mt-0.5">
                                      <Store size={15} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-black text-slate-900 truncate">
                                        {addr.recipient_name} · {addr.label || 'Commercial'}
                                      </p>
                                      <p className="text-[11px] text-slate-500 leading-relaxed truncate">
                                        {addr.line1}, {addr.city} - {addr.postal_code}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 3. ASSIGN DELIVERY PARTNER STAGE (Appears when order is packed) */}
                              {isPacked && (
                                <div className="rounded-2xl bg-emerald-50/70 border border-emerald-300 p-3 space-y-2.5 animate-in fade-in duration-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                                      <UserCheck size={15} className="text-emerald-800" /> Assign Delivery Partner
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-full">
                                      Packed & Staged
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <select
                                        value={driverSelections[ord.id] || asg?.delivery_partner_id || ''}
                                        disabled={isProcessing}
                                        onChange={(e) =>
                                          setDriverSelections((prev) => ({ ...prev, [ord.id]: e.target.value }))
                                        }
                                        className="w-full h-10 pl-3 pr-8 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-slate-800 outline-none focus:border-[#0a382c] appearance-none shadow-2xs"
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
                                        className="absolute right-3 top-3 text-slate-400 pointer-events-none"
                                      />
                                    </div>

                                    <button
                                      disabled={isProcessing || (!driverSelections[ord.id] && !asg?.delivery_partner_id)}
                                      onClick={() => {
                                        const chosen = driverSelections[ord.id] || asg?.delivery_partner_id || '';
                                        void handleAssignDriver(ord.id, chosen);
                                      }}
                                      className="h-10 px-4 rounded-xl bg-[#0a382c] hover:bg-[#082d23] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition disabled:opacity-50"
                                    >
                                      {isProcessing ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <>
                                          <Check size={14} /> Assign & Move to Ready
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Ready for Pickup Stage Info */}
                              {isReadyForPickup && assignedDriver && (
                                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
                                      <Truck size={14} />
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-slate-900">{assignedDriver.name}</p>
                                      <p className="text-[10px] text-slate-500">{assignedDriver.phone}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setEditingDriverOrderId(ord.id)}
                                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                                  >
                                    Reassign
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons Toolbar */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                              {ord.status === 'pending' && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => void handleConfirmOrder(ord.id)}
                                  className="flex-1 h-10 rounded-full bg-[#0a382c] hover:bg-[#082d23] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                  Confirm & Deduct Stock
                                </button>
                              )}

                              {/* 3. Confirmed button moves order to 'packed' (Assign Partner stage) */}
                              {ord.status === 'confirmed' && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => void handleUpdateStatus(ord.id, 'packed')}
                                  className="flex-1 h-10 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                                  Mark as Packed (Next: Assign Driver)
                                </button>
                              )}

                              {!isDelivered && !isCancelled && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => void handleCancelOrder(ord.id)}
                                  className="h-10 px-4 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black flex items-center gap-1 active:scale-95 transition"
                                >
                                  <XCircle size={14} /> Cancel
                                </button>
                              )}

                              <button
                                onClick={() => void handlePrint(ord.id, ord.order_number)}
                                className="h-10 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black flex items-center gap-1.5 shadow-2xs active:scale-95 transition"
                              >
                                <Printer size={14} className="text-slate-600" /> Invoice
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Orders Pagination */}
                  {filteredOrders.length > ORDERS_PER_PAGE && (
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-[22px] px-4 py-3 shadow-xs">
                      <p className="text-xs font-semibold text-slate-500">
                        Showing <span className="font-black text-slate-900">{(ordersPage - 1) * ORDERS_PER_PAGE + 1}</span> to{' '}
                        <span className="font-black text-slate-900">{Math.min(ordersPage * ORDERS_PER_PAGE, filteredOrders.length)}</span> of{' '}
                        <span className="font-black text-slate-900">{filteredOrders.length}</span>
                      </p>

                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={ordersPage === 1}
                          onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                          className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 disabled:opacity-40 transition"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-black text-[#0a382c] px-2">
                          Page {ordersPage} / {totalOrderPages}
                        </span>
                        <button
                          disabled={ordersPage >= totalOrderPages}
                          onClick={() => setOrdersPage((p) => Math.min(totalOrderPages, p + 1))}
                          className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 disabled:opacity-40 transition"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INVOICES TAB (With 2. Red Pill for Cancelled Invoices) */}
              {activeTab === 'invoices' && (
                <div className="space-y-4">
                  {filteredInvoices.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-[26px] p-12 text-center text-slate-400 space-y-2">
                      <FileText size={40} className="mx-auto text-slate-300" />
                      <p className="font-bold text-sm text-slate-700">No invoices match period</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {paginatedInvoices.map((ord) => {
                        const addr = ord.address_id ? addressMap[ord.address_id] : null;
                        const pay = paymentsMap[ord.id];
                        const isCancelled = ord.status === 'cancelled';
                        const hasPendingCash = pay && !pay.isFullyPaid && ord.status !== 'delivered' && pay.amountDue > 0;

                        return (
                          <div
                            key={ord.id}
                            className={`bg-white border rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-3 transition ${
                              isCancelled
                                ? 'border-red-300 bg-red-50/10'
                                : hasPendingCash
                                ? 'border-amber-300'
                                : 'border-slate-200/80'
                            }`}
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-sm text-slate-900">{ord.order_number}</span>

                                    {/* 2. Highlighted Red Pill for Cancelled Invoices */}
                                    <span
                                      className={`text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                        isCancelled
                                          ? 'bg-red-100 text-red-700 border border-red-300 shadow-2xs'
                                          : ord.status === 'delivered'
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}
                                    >
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                          isCancelled ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                                        }`}
                                      />
                                      {ord.status.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 font-bold mt-0.5">
                                    {addr?.recipient_name} · {addr?.city}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-semibold">
                                    <Calendar size={11} />
                                    {new Date(ord.created_at).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm font-black text-slate-900">
                                    ₹{Number(ord.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                    GST: ₹{Number(ord.gst_amount || 0).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {/* Paid Source Chips */}
                              {pay && (
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold pt-1">
                                  {pay.walletPaid > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                                      <Wallet size={11} className="text-emerald-600" />
                                      Wallet: ₹{pay.walletPaid.toFixed(0)}
                                    </span>
                                  )}

                                  {pay.onlinePaid > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800">
                                      <CreditCard size={11} className="text-blue-600" />
                                      Razorpay: ₹{pay.onlinePaid.toFixed(0)}
                                    </span>
                                  )}

                                  {pay.codPaid > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900">
                                      <Banknote size={11} className="text-amber-600" />
                                      COD: ₹{pay.codPaid.toFixed(0)}
                                    </span>
                                  )}

                                  {hasPendingCash && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white font-black">
                                      <Banknote size={11} className="text-amber-100" />
                                      Collect: ₹{pay.amountDue.toFixed(0)} COD
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => void handlePrint(ord.id, ord.order_number)}
                              className="w-full h-10 rounded-full bg-[#0a382c] hover:bg-[#082d23] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition"
                            >
                              <Printer size={14} /> Print GST Invoice
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Invoice Pagination */}
                  {filteredInvoices.length > INVOICES_PER_PAGE && (
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-[22px] px-4 py-3 shadow-xs">
                      <p className="text-xs font-semibold text-slate-500">
                        Showing <span className="font-black text-slate-900">{(invoicesPage - 1) * INVOICES_PER_PAGE + 1}</span> to{' '}
                        <span className="font-black text-slate-900">{Math.min(invoicesPage * INVOICES_PER_PAGE, filteredInvoices.length)}</span> of{' '}
                        <span className="font-black text-slate-900">{filteredInvoices.length}</span>
                      </p>

                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={invoicesPage === 1}
                          onClick={() => setInvoicesPage((p) => Math.max(1, p - 1))}
                          className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 disabled:opacity-40 transition"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-black text-[#0a382c] px-2">
                          Page {invoicesPage} / {totalInvoicePages}
                        </span>
                        <button
                          disabled={invoicesPage >= totalInvoicePages}
                          onClick={() => setInvoicesPage((p) => Math.min(totalInvoicePages, p + 1))}
                          className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 disabled:opacity-40 transition"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4 & 5: INVENTORY & LOW STOCK */}
              {(activeTab === 'inventory' || activeTab === 'low_stock') && (
                <div>
                  {(activeTab === 'inventory' ? filteredProducts : lowStockProducts).length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-[26px] p-12 text-center text-slate-400 space-y-2">
                      <Boxes size={40} className="mx-auto text-slate-300" />
                      <p className="font-bold text-sm text-slate-700">No items found</p>
                      <p className="text-xs">
                        {activeTab === 'low_stock'
                          ? 'All products are comfortably above their minimum threshold.'
                          : 'No inventory products match your search.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                            className={`bg-white border rounded-[24px] p-4 shadow-sm space-y-3 flex flex-col justify-between transition-all ${
                              isOut
                                ? 'border-red-300 ring-2 ring-red-100'
                                : isLow
                                ? 'border-amber-300 ring-2 ring-amber-100'
                                : 'border-slate-200/80 hover:border-emerald-200'
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

                            {/* Quantity Modifier Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-400 font-bold mr-1">Qty:</span>
                                <button
                                  onClick={() => handleStockDelta(prod.id, currentStock, -1)}
                                  className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition"
                                >
                                  <Minus size={13} />
                                </button>

                                <input
                                  type="number"
                                  value={displayStock}
                                  onChange={(e) => handleStockInputChange(prod.id, e.target.value)}
                                  className={`w-16 h-8 text-center text-xs font-black rounded-xl border outline-none ${
                                    isModified
                                      ? 'border-[#0a382c] bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-300'
                                      : 'border-slate-200 bg-white text-slate-900'
                                  }`}
                                />

                                <button
                                  onClick={() => handleStockDelta(prod.id, currentStock, 1)}
                                  className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition"
                                >
                                  <Plus size={13} />
                                </button>

                                <div className="flex items-center gap-1 ml-1">
                                  {[5, 10, 25].map((amt) => (
                                    <button
                                      key={amt}
                                      onClick={() => handleStockDelta(prod.id, currentStock, amt)}
                                      className="h-8 px-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-[10px] border border-slate-200 active:scale-95 transition"
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
                                    className="h-8 px-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-black text-xs flex items-center gap-1 active:scale-95 transition"
                                  >
                                    <RotateCcw size={12} />
                                    Cancel
                                  </button>
                                  <button
                                    disabled={isSaving}
                                    onClick={() => void handleSaveStock(prod.id)}
                                    className="h-8 px-3 rounded-full bg-[#0a382c] hover:bg-[#082d23] text-white font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 transition disabled:opacity-50"
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

      {/* 1. SOLID BOTTOM NAVIGATION BAR (Includes Dashboard) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] safe-bottom md:hidden">
        <div className="max-w-xl mx-auto flex items-center justify-around h-16 px-1">
          {/* Dashboard Item */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              activeTab === 'dashboard' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard size={19} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Dashboard</span>
            {activeTab === 'dashboard' && <span className="h-1 w-5 rounded-full bg-[#0a382c] -mb-1" />}
          </button>

          {/* Orders Item */}
          <button
            onClick={() => {
              setActiveTab('orders');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              activeTab === 'orders' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Package size={19} strokeWidth={activeTab === 'orders' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Orders</span>
            {activeTab === 'orders' && <span className="h-1 w-5 rounded-full bg-[#0a382c] -mb-1" />}
            {orders.length > 0 && (
              <span className="absolute top-1.5 right-3.5 bg-slate-900 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-xs">
                {orders.length}
              </span>
            )}
          </button>

          {/* Invoices Item */}
          <button
            onClick={() => {
              setActiveTab('invoices');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              activeTab === 'invoices' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <FileText size={19} strokeWidth={activeTab === 'invoices' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Invoices</span>
            {activeTab === 'invoices' && <span className="h-1 w-5 rounded-full bg-[#0a382c] -mb-1" />}
          </button>

          {/* Inventory Item */}
          <button
            onClick={() => {
              setActiveTab('inventory');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              activeTab === 'inventory' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Boxes size={19} strokeWidth={activeTab === 'inventory' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Inventory</span>
            {activeTab === 'inventory' && <span className="h-1 w-5 rounded-full bg-[#0a382c] -mb-1" />}
          </button>

          {/* Low Stock Item */}
          <button
            onClick={() => {
              setActiveTab('low_stock');
              setSearchQuery('');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              activeTab === 'low_stock' ? 'text-red-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <AlertTriangle size={19} strokeWidth={activeTab === 'low_stock' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Low Stock</span>
            {activeTab === 'low_stock' && <span className="h-1 w-5 rounded-full bg-red-600 -mb-1" />}
            {lowStockProducts.length > 0 && (
              <span className="absolute top-1.5 right-3.5 bg-red-500 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center animate-pulse shadow-xs">
                {lowStockProducts.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Package Inspection Modal */}
      {inspectOrderId && !expandedOrderItems[inspectOrderId] && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">Package Contents</h3>
                <p className="text-[11px] text-slate-500">Inspect ordered line items before dispatch</p>
              </div>
              <button
                onClick={() => setInspectOrderId(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <X size={15} />
              </button>
            </div>

            {inspectLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 size={26} className="animate-spin text-[#0a382c]" />
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 divide-y divide-slate-50">
                {inspectItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs py-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-black text-slate-900 truncate">
                        {item.brand} {item.product_name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                        {item.pack_size} · Qty: <span className="font-black text-slate-800">{item.quantity}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">
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
              className="w-full h-11 rounded-full bg-[#0a382c] hover:bg-[#082d23] text-white text-xs font-black transition shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Staff Registration Modal */}
      <StaffRegistrationModal isOpen={isStaffUnregistered} />
    </div>
  );
}
