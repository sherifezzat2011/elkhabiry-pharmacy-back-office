import { addDays, format, subDays } from "date-fns";
import type {
  Branch,
  Customer,
  Doctor,
  InventoryBatch,
  MonthlyTarget,
  Order,
  Prescription,
  Product,
  Supplier,
} from "@/types";

const categories = [
  "Analgesics",
  "Antibiotics",
  "Cardiology",
  "Diabetes",
  "Gastro",
  "Vitamins",
  "Dermatology",
  "Respiratory",
  "Pediatrics",
  "Women Health",
  "Eye Care",
  "Medical Supplies",
];

const baseProducts = [
  "Panadol",
  "Brufen",
  "Voltaren",
  "Augmentin",
  "Concor",
  "Nexium",
  "Glucophage",
  "Centrum",
  "Bepanthen",
  "Cataflam",
  "Zyrtec",
  "Aspirin Protect",
  "Lasix",
  "Crestor",
  "Telfast",
  "Otrivin",
  "Amaryl",
  "Janumet",
  "Betadine",
  "Maalox",
];

export const branches: Branch[] = [
  { id: "b1", name: "Nasr City Flagship", city: "Cairo", area: "Nasr City" },
  { id: "b2", name: "Heliopolis Care", city: "Cairo", area: "Heliopolis" },
  { id: "b3", name: "Mansoura Central", city: "Mansoura", area: "Downtown" },
  { id: "b4", name: "Alexandria Corniche", city: "Alexandria", area: "Stanley" },
  { id: "b5", name: "Tanta Medical Hub", city: "Tanta", area: "El Bahr" },
];

export const suppliers: Supplier[] = Array.from({ length: 12 }, (_, index) => ({
  id: `s${index + 1}`,
  name:
    [
      "PharmaOverseas",
      "Ibnsina Pharma",
      "United Company",
      "EIPICO Distribution",
      "Eva Pharma",
      "Hikma Medical",
      "Amoun Supply",
      "Novartis Egypt",
      "Sanofi Distribution",
      "Pfizer Trade",
      "Rameda Care",
      "Mash Premiere",
    ][index] ?? `Supplier ${index + 1}`,
  country: index % 4 === 0 ? "Germany" : index % 3 === 0 ? "Switzerland" : "Egypt",
  reliability: 78 + ((index * 7) % 21),
}));

export const products: Product[] = Array.from({ length: 150 }, (_, index) => {
  const name = `${baseProducts[index % baseProducts.length]} ${index % 5 === 0 ? "Advance" : index % 3 === 0 ? "Plus" : "Tab"} ${100 + (index % 8) * 50}mg`;
  const price = 42 + ((index * 17) % 380);
  const cost = price * (0.58 + ((index % 9) * 0.025));
  return {
    id: `p${index + 1}`,
    name,
    category: categories[index % categories.length],
    supplierId: suppliers[index % suppliers.length].id,
    price,
    cost,
    chronic: ["Cardiology", "Diabetes", "Respiratory"].includes(categories[index % categories.length]),
  };
});

export const customers: Customer[] = Array.from({ length: 800 }, (_, index) => ({
  id: `c${index + 1}`,
  name: `Customer ${String(index + 1).padStart(4, "0")}`,
  type: ["Walk-in", "Family", "VIP", "Chronic Patient", "Corporate"][index % 5] as Customer["type"],
  city: branches[index % branches.length].city,
  preferredBranchId: branches[index % branches.length].id,
}));

const specialties = ["Cardiology", "Internal Medicine", "Pediatrics", "Dermatology", "Diabetes", "ENT", "Gynecology", "Orthopedics"];

export const doctors: Doctor[] = Array.from({ length: 40 }, (_, index) => ({
  id: `d${index + 1}`,
  name: `Dr. ${["Mona", "Ahmed", "Karim", "Laila", "Omar", "Nour", "Hany", "Sara"][index % 8]} ${["Hassan", "Fahmy", "Saleh", "Nabil", "Maher"][index % 5]}`,
  specialty: specialties[index % specialties.length],
  city: branches[index % branches.length].city,
}));

const startDate = new Date("2026-01-01T00:00:00");

export const orders: Order[] = Array.from({ length: 3000 }, (_, index) => {
  const date = addDays(startDate, index % 181);
  const itemCount = 1 + (index % 4);
  const items = Array.from({ length: itemCount }, (_, itemIndex) => {
    const product = products[(index * 7 + itemIndex * 13) % products.length];
    return {
      productId: product.id,
      quantity: 1 + ((index + itemIndex) % 5),
      unitPrice: product.price,
      unitCost: product.cost,
    };
  });
  return {
    id: `o${index + 1}`,
    date: format(date, "yyyy-MM-dd"),
    hour: 8 + (index % 15),
    branchId: branches[index % branches.length].id,
    customerId: customers[(index * 11) % customers.length].id,
    channel: ["In Store", "Delivery", "Mobile App", "Insurance"][index % 4] as Order["channel"],
    paymentMethod: ["Cash", "Card", "Wallet", "Insurance"][(index * 3) % 4] as Order["paymentMethod"],
    items,
  };
});

export const inventoryBatches: InventoryBatch[] = products.flatMap((product, productIndex) =>
  branches.map((branch, branchIndex) => {
    const quantity = (productIndex * 19 + branchIndex * 23) % 240;
    return {
      id: `ib-${product.id}-${branch.id}`,
      productId: product.id,
      branchId: branch.id,
      supplierId: product.supplierId,
      quantity,
      reserved: Math.min(quantity, (productIndex * 3 + branchIndex * 11) % 42),
      reorderPoint: 28 + (productIndex % 32),
      expiryDate: format(addDays(new Date("2026-07-01T00:00:00"), (productIndex * 17 + branchIndex * 29) % 520 - 80), "yyyy-MM-dd"),
      receivedDate: format(subDays(new Date("2026-07-01T00:00:00"), (productIndex * 11 + branchIndex * 9) % 320), "yyyy-MM-dd"),
    };
  }),
);

export const prescriptions: Prescription[] = Array.from({ length: 1150 }, (_, index) => {
  const doctor = doctors[(index * 5) % doctors.length];
  const productIds = [products[(index * 3) % products.length].id, products[(index * 7 + 4) % products.length].id];
  const value = productIds.reduce((sum, id) => sum + (products.find((product) => product.id === id)?.price ?? 0), 0);
  return {
    id: `rx${index + 1}`,
    date: format(addDays(startDate, index % 181), "yyyy-MM-dd"),
    doctorId: doctor.id,
    customerId: customers[(index * 13) % customers.length].id,
    branchId: branches[index % branches.length].id,
    status: ["Completed", "Partial", "Pending", "Cancelled"][index % 4] as Prescription["status"],
    productIds,
    value,
  };
});

export const monthlyTargets: MonthlyTarget[] = branches.flatMap((branch, branchIndex) =>
  Array.from({ length: 6 }, (_, monthIndex) => ({
    month: `2026-${String(monthIndex + 1).padStart(2, "0")}`,
    branchId: branch.id,
    target: 820000 + branchIndex * 110000 + monthIndex * 42000,
  })),
);

export const dimensions = {
  categories,
  cities: Array.from(new Set(branches.map((branch) => branch.city))),
  customerTypes: ["Walk-in", "Family", "VIP", "Chronic Patient", "Corporate"],
  prescriptionStatuses: ["Completed", "Partial", "Pending", "Cancelled"],
  specialties,
};
