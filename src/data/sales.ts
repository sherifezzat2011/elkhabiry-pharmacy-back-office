export type SalesOrderStatus = "Pending" | "Confirmed" | "Processing" | "Ready for Dispatch" | "Completed" | "Cancelled";
export type DeliveryStatus = "Not Scheduled" | "Preparing" | "Out for Delivery" | "Delivered" | "Delivery Failed" | "Returned";
export type PaymentStatus = "Paid" | "Unpaid" | "Partially Paid" | "Refunded" | "Cash on Delivery" | "Pending";
export type CustomerStatus = "Active" | "Inactive" | "On Hold";
export type CustomerType = "Patient" | "Follow-up Patient" | "Chronic Care" | "Family Account" | "Insurance Patient" | "Independent Pharmacy" | "Pharmacy Chain" | "Clinic" | "Hospital" | "Medical Center";
export type OrderSource = "mobile_app" | "website" | "whatsapp" | "call_center" | "walk_in" | "talabat" | "chefaa" | "vezeeta" | "yodawy";

export type SalesCustomer = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  altPhone: string;
  email: string;
  city: string;
  area: string;
  type: CustomerType;
  status: CustomerStatus;
  taxNumber: string;
  commercialRegistration: string;
  address: string;
  creditLimit: number;
  paymentTerms: string;
  salesRep: string;
  defaultWarehouse: string;
  preferredDelivery: string;
  notes: string;
  outstandingBalance: number;
};

export type SalesOrderItem = {
  product: string;
  sku: string;
  batch: string;
  expiry: string;
  warehouse: string;
  availableStock: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
};

export type SalesOrder = {
  id: string;
  orderNumber: string;
  customerId: string;
  date: string;
  city: string;
  orderSource: OrderSource;
  marketplaceSource: "Talabat" | "Vezeeta" | "Chefaa" | "Yodawy" | "Other Marketplace" | null;
  channel: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  fulfillmentStatus: SalesOrderStatus;
  deliveryStatus: DeliveryStatus;
  deliveryMethod: string;
  warehouse: string;
  salesRep: string;
  deliveryFee: number;
  paidAmount: number;
  cancellationReason?: string;
  items: SalesOrderItem[];
};

export const salesWarehouses = ["Cairo Care Center", "Giza Care Center", "Alexandria Clinic", "Delta Care Center"];
export const salesRepresentatives = ["Dr. Ahmed Samir", "Nour Mostafa", "Karim Adel", "Dina Hossam"];
export const salesChannels = ["Mobile App", "Website", "WhatsApp", "Call Center", "Walk-In", "Marketplace"];
export const paymentMethods = ["Cash", "Card", "Insurance", "Online Payment"];
export const deliveryMethods = ["Home Delivery", "Clinic Pickup", "Reception Pickup"];

export const salesProducts = [
  { name: "Panadol Extra 24 Tablets", sku: "MED-PAN-024", price: 145, stock: 420, expiry: "2027-04-18" },
  { name: "Augmentin 1g 14 Tablets", sku: "MED-AUG-1G", price: 245, stock: 280, expiry: "2027-01-12" },
  { name: "Cataflam 50mg 20 Tablets", sku: "MED-CAT-050", price: 118, stock: 165, expiry: "2026-11-09" },
  { name: "Concor 5mg 30 Tablets", sku: "MED-CON-005", price: 210, stock: 230, expiry: "2027-03-22" },
  { name: "Glucophage 1000mg 30 Tablets", sku: "MED-GLU-1000", price: 176, stock: 310, expiry: "2027-02-14" },
  { name: "Nexium 40mg 14 Tablets", sku: "MED-NEX-040", price: 265, stock: 145, expiry: "2026-12-28" },
  { name: "Ventolin Inhaler", sku: "MED-VEN-INH", price: 198, stock: 96, expiry: "2026-10-18" },
  { name: "Insulin Mixtard 30", sku: "MED-INS-M30", price: 385, stock: 54, expiry: "2026-09-22" },
  { name: "Strepsils Honey & Lemon", sku: "MED-STR-HL", price: 92, stock: 520, expiry: "2027-06-01" },
  { name: "Omega-3 Capsules", sku: "MED-OMG-030", price: 310, stock: 188, expiry: "2027-05-17" },
];

export const retailPatients = [
  "Ahmed Mohamed",
  "Sara Ali",
  "Mohamed Adel",
  "Mona Hassan",
  "Omar Khaled",
  "Yasmin Samir",
  "Mahmoud Ali",
  "Nour Mostafa",
  "Karim Adel",
  "Dina Hossam",
  "Hany Fouad",
  "Reem Said",
  "Laila Amin",
  "Youssef Kamal",
  "Aya Sherif",
  "Sherif Adel",
];

export const retailBranches = [
  "Nasr City Branch",
  "Heliopolis Branch",
  "Alexandria Branch",
  "Mansoura Branch",
  "Tanta Branch",
  "Maadi Branch",
];

export const retailCategoryBySku: Record<string, string> = {
  "MED-PAN-024": "OTC Medicines",
  "MED-AUG-1G": "Prescription Medicines",
  "MED-CAT-050": "Prescription Medicines",
  "MED-CON-005": "Prescription Medicines",
  "MED-GLU-1000": "Prescription Medicines",
  "MED-NEX-040": "Prescription Medicines",
  "MED-VEN-INH": "Medical Devices",
  "MED-INS-M30": "Prescription Medicines",
  "MED-STR-HL": "OTC Medicines",
  "MED-OMG-030": "Vitamins & Supplements",
};

export const mockSalesCustomers: SalesCustomer[] = [
  ["PAT-1007", "Ahmed Hassan", "PAT-1007", "+20 101 245 7812", "ahmed.hassan@example.com", "Cairo", "Nasr City", "Patient", "Active", 0],
  ["PAT-1006", "Sara Mohamed", "PAT-1006", "+20 111 823 4590", "sara.mohamed@example.com", "Giza", "Dokki", "Follow-up Patient", "Active", 1200],
  ["PAT-1005", "Mostafa Ali", "PAT-1005", "+20 122 947 3185", "mostafa.ali@example.com", "Alexandria", "Smouha", "Chronic Care", "Active", 0],
  ["PAT-1004", "Nour Hany", "PAT-1004", "+20 100 458 7321", "nour.hany@example.com", "Mansoura", "Downtown", "Insurance Patient", "Active", 0],
  ["PAT-1003", "Youssef Mahmoud", "PAT-1003", "+20 109 334 6218", "youssef.mahmoud@example.com", "Tanta", "El Bahr", "Patient", "Active", 850],
  ["PAT-1002", "Mariam Tarek", "PAT-1002", "+20 115 638 2201", "mariam.tarek@example.com", "Cairo", "Heliopolis", "Family Account", "Active", 0],
  ["PAT-1001", "Omar Khaled", "PAT-1001", "+20 120 774 9103", "omar.khaled@example.com", "Giza", "Mohandessin", "Follow-up Patient", "Active", 0],
] .map(([id, name, contact, phone, email, city, area, type, status, balance], index) => ({
  id: String(id),
  name: String(name),
  contact: String(contact),
  phone: String(phone),
  altPhone: `+20 10${index} 555 10${index}`,
  email: String(email),
  city: String(city),
  area: String(area),
  type: type as CustomerType,
  status: status as CustomerStatus,
  taxNumber: `TX-${225000 + index * 71}`,
  commercialRegistration: `CR-${78000 + index * 43}`,
  address: `${12 + index} ${String(area)} Health Street`,
  creditLimit: 0,
  paymentTerms: "Patient billing",
  salesRep: salesRepresentatives[index % salesRepresentatives.length],
  defaultWarehouse: salesWarehouses[index % salesWarehouses.length],
  preferredDelivery: deliveryMethods[index % deliveryMethods.length],
  notes: index % 3 === 0 ? "Prefers appointment reminders by phone." : "Standard patient profile.",
  outstandingBalance: Number(balance),
}));

function makeItems(seed: number, count: number): SalesOrderItem[] {
  return Array.from({ length: count }, (_, index) => {
    const product = salesProducts[(seed + index * 2) % salesProducts.length];
    const quantity = 2 + ((seed + index * 3) % 15);
    const discount = index % 3 === 0 ? 5 : 0;
    const tax = Math.round(quantity * product.price * 0.14);
    return {
      product: product.name,
      sku: product.sku,
      batch: `B-${2026}${(seed + index).toString().padStart(3, "0")}`,
      expiry: product.expiry,
      warehouse: salesWarehouses[(seed + index) % salesWarehouses.length],
      availableStock: product.stock - seed * 3,
      quantity,
      unitPrice: product.price,
      discount,
      tax,
    };
  });
}

const statuses: SalesOrderStatus[] = ["Pending", "Confirmed", "Processing", "Ready for Dispatch", "Completed", "Cancelled"];
const deliveryStatuses: DeliveryStatus[] = ["Not Scheduled", "Preparing", "Out for Delivery", "Delivered", "Delivery Failed", "Returned"];
const paymentStatuses: PaymentStatus[] = ["Paid", "Unpaid", "Partially Paid", "Refunded", "Cash on Delivery"];
export const orderSourceConfig: Record<OrderSource, { label: string }> = {
  mobile_app: { label: "Mobile App" },
  website: { label: "Website" },
  whatsapp: { label: "WhatsApp" },
  call_center: { label: "Call Center" },
  walk_in: { label: "Walk-In" },
  talabat: { label: "Talabat" },
  chefaa: { label: "Chefaa" },
  vezeeta: { label: "Vezeeta" },
  yodawy: { label: "Yodawy" },
};

const orderSources: OrderSource[] = [
  ...Array.from({ length: 9 }, () => "mobile_app" as const),
  ...Array.from({ length: 7 }, () => "website" as const),
  ...Array.from({ length: 6 }, () => "whatsapp" as const),
  ...Array.from({ length: 6 }, () => "call_center" as const),
  ...Array.from({ length: 5 }, () => "walk_in" as const),
  ...Array.from({ length: 3 }, () => "talabat" as const),
  ...Array.from({ length: 2 }, () => "chefaa" as const),
  ...Array.from({ length: 2 }, () => "vezeeta" as const),
  ...Array.from({ length: 2 }, () => "yodawy" as const),
];

export const mockSalesOrders: SalesOrder[] = Array.from({ length: 42 }, (_, index) => {
  const customer = mockSalesCustomers[index % mockSalesCustomers.length];
  const explicitStatus = index < 5
    ? (["Processing", "Ready for Dispatch", "Pending", "Completed", "Cancelled"] as SalesOrderStatus[])[index]
    : statuses[(index + 2) % statuses.length];
  const items = makeItems(index + 1, 2 + (index % 4));
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = items.reduce((sum, item) => sum + item.discount, 0);
  const tax = items.reduce((sum, item) => sum + item.tax, 0);
  const deliveryFee = 75 + (index % 4) * 25;
  const total = subtotal - discount + tax + deliveryFee;
  const day = 21 - (index % 18);
  const hour = 9 + (index % 9);
  const minute = (15 + index * 7) % 60;
  return {
    id: `ord-${248 - index}`,
    orderNumber: `SO-2026-${String(248 - index).padStart(4, "0")}`,
    customerId: customer.id,
    date: `2026-07-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
    city: customer.city,
    orderSource: orderSources[index % orderSources.length],
    marketplaceSource: null,
    channel: salesChannels[index % salesChannels.length],
    paymentStatus: explicitStatus === "Cancelled" ? "Refunded" : paymentStatuses[index % paymentStatuses.length],
    paymentMethod: paymentMethods[index % paymentMethods.length],
    fulfillmentStatus: explicitStatus,
    deliveryStatus: explicitStatus === "Completed" ? "Delivered" : explicitStatus === "Cancelled" ? "Not Scheduled" : deliveryStatuses[index % deliveryStatuses.length],
    deliveryMethod: deliveryMethods[index % deliveryMethods.length],
    warehouse: salesWarehouses[index % salesWarehouses.length],
    salesRep: salesRepresentatives[index % salesRepresentatives.length],
    deliveryFee,
    paidAmount: explicitStatus === "Cancelled" ? 0 : Math.round(total * (index % 3 === 0 ? 1 : index % 3 === 1 ? 0.55 : 0)),
    cancellationReason: explicitStatus === "Cancelled" ? "Customer Request" : undefined,
    items,
  };
});

export function orderTotal(order: SalesOrder) {
  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = order.items.reduce((sum, item) => sum + item.discount, 0);
  const tax = order.items.reduce((sum, item) => sum + item.tax, 0);
  return subtotal - discount + tax + order.deliveryFee;
}

export function patientNameForOrder(order: SalesOrder) {
  const orderNumber = Number(order.orderNumber.split("-").at(-1) ?? 0);
  return retailPatients[orderNumber % retailPatients.length];
}

export function branchNameForOrder(order: SalesOrder) {
  const orderNumber = Number(order.orderNumber.split("-").at(-1) ?? 0);
  return retailBranches[orderNumber % retailBranches.length];
}
