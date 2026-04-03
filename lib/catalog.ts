import {
  CaseProduct,
  CpuProduct,
  FaqEntry,
  FormFactor,
  GpuProduct,
  MemoryProduct,
  MotherboardProduct,
  Product,
  PsuProduct,
  StorageProduct,
} from "@/lib/types";

const cpuImage =
  "https://images.unsplash.com/photo-1591799265444-d66432b91588?auto=format&fit=crop&w=1200&q=80";
const motherboardImage =
  "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80";
const memoryImage =
  "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1200&q=80";
const storageImage =
  "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=80";
const gpuImage =
  "https://images.unsplash.com/photo-1587135991058-8816c028691f?auto=format&fit=crop&w=1200&q=80";
const psuImage =
  "https://images.unsplash.com/photo-1540829917886-91ab031b1764?auto=format&fit=crop&w=1200&q=80";
const caseImage =
  "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1200&q=80";

const cpuProducts: CpuProduct[] = [
  {
    id: "cpu-7800x3d",
    slug: "amd-ryzen-7-7800x3d",
    name: "AMD Ryzen 7 7800X3D",
    brand: "AMD",
    priceCents: 37900,
    image: "/components/cpu/2823-amd-ryzen-7-7800x3d-42-ghz-5-ghz-review.webp",
    description: "CPU gaming premium con gran eficiencia.",
    type: "cpu",
    socket: "AM5",
    cores: 8,
    threads: 16,
    tdpWatts: 120,
  },
  {
    id: "cpu-7950x3d",
    slug: "amd-ryzen-9-7950x3d",
    name: "AMD Ryzen 9 7950X3D",
    brand: "AMD",
    priceCents: 62900,
    image: "/components/cpu/3936-amd-ryzen-9-7950x-45-ghz-box-sin-ventilador-especificaciones.webp",
    description: "CPU tope para gaming y creación.",
    type: "cpu",
    socket: "AM5",
    cores: 16,
    threads: 32,
    tdpWatts: 170,
  },
  {
    id: "cpu-7700x",
    slug: "amd-ryzen-7-7700x",
    name: "AMD Ryzen 7 7700X",
    brand: "AMD",
    priceCents: 28900,
    image: "/components/cpu/1662-amd-ryzen-7-7700-38-53-ghz-box.webp",
    description: "Excelente equilibrio para productividad.",
    type: "cpu",
    socket: "AM5",
    cores: 8,
    threads: 16,
    tdpWatts: 105,
  },
  {
    id: "cpu-7600",
    slug: "amd-ryzen-5-7600",
    name: "AMD Ryzen 5 7600",
    brand: "AMD",
    priceCents: 20900,
    image: "/components/cpu/1718-amd-ryzen-5-7600-38-51-ghz-box.webp",
    description: "Entrada sólida en AM5 para gaming.",
    type: "cpu",
    socket: "AM5",
    cores: 6,
    threads: 12,
    tdpWatts: 65,
  },
  {
    id: "cpu-5800x3d",
    slug: "amd-ryzen-7-5800x3d",
    name: "AMD Ryzen 7 5800X3D",
    brand: "AMD",
    priceCents: 26900,
    image: "/components/cpu/168-amd-ryzen-7-5800x-38ghz.webp",
    description: "Opción AM4 con gran rendimiento gaming.",
    type: "cpu",
    socket: "AM4",
    cores: 8,
    threads: 16,
    tdpWatts: 105,
  },
  {
    id: "cpu-5700x",
    slug: "amd-ryzen-7-5700x",
    name: "AMD Ryzen 7 5700X",
    brand: "AMD",
    priceCents: 18900,
    image: "/components/cpu/1614-amd-ryzen-7-5700-37-46-ghz.webp",
    description: "CPU AM4 eficiente para presupuesto medio.",
    type: "cpu",
    socket: "AM4",
    cores: 8,
    threads: 16,
    tdpWatts: 65,
  },
  {
    id: "cpu-14600k",
    slug: "intel-core-i5-14600k",
    name: "Intel Core i5-14600K",
    brand: "Intel",
    priceCents: 31900,
    image: "/components/cpu/1381-intel-core-i5-14600kf-35-54ghz-box-comprar.webp",
    description: "CPU versátil para gaming y productividad.",
    type: "cpu",
    socket: "LGA1700",
    cores: 14,
    threads: 20,
    tdpWatts: 125,
  },
  {
    id: "cpu-14700k",
    slug: "intel-core-i7-14700k",
    name: "Intel Core i7-14700K",
    brand: "Intel",
    priceCents: 43900,
    image: "/components/cpu/1341-intel-core-i7-14700k-34-56ghz-box.webp",
    description: "Alto rendimiento híbrido para cargas mixtas.",
    type: "cpu",
    socket: "LGA1700",
    cores: 20,
    threads: 28,
    tdpWatts: 125,
  },
  {
    id: "cpu-14900k",
    slug: "intel-core-i9-14900k",
    name: "Intel Core i9-14900K",
    brand: "Intel",
    priceCents: 61900,
    image: "/components/cpu/1139-intel-core-i9-14900k-32-6ghz-box.webp",
    description: "Flagship para gaming extremo y workstation.",
    type: "cpu",
    socket: "LGA1700",
    cores: 24,
    threads: 32,
    tdpWatts: 125,
  },
  {
    id: "cpu-13600k",
    slug: "intel-core-i5-13600k",
    name: "Intel Core i5-13600K",
    brand: "Intel",
    priceCents: 27900,
    image: "/components/cpu/1723-intel-core-i5-13600k-35-ghz-box.webp",
    description: "Gran valor para equipos de alto rendimiento.",
    type: "cpu",
    socket: "LGA1700",
    cores: 14,
    threads: 20,
    tdpWatts: 125,
  },
  {
    id: "cpu-13400f",
    slug: "intel-core-i5-13400f",
    name: "Intel Core i5-13400F",
    brand: "Intel",
    priceCents: 19900,
    image: "/components/cpu/1324-intel-core-i5-13400f-25-ghz-46-ghz.webp",
    description: "CPU equilibrada para gaming sin gráfica integrada.",
    type: "cpu",
    socket: "LGA1700",
    cores: 10,
    threads: 16,
    tdpWatts: 65,
  },
  {
    id: "cpu-12400f",
    slug: "intel-core-i5-12400f",
    name: "Intel Core i5-12400F",
    brand: "Intel",
    priceCents: 14900,
    image: "/components/cpu/145-intel-core-i5-12400-44-ghz.webp",
    description: "Opción económica y solvente para gaming 1080p.",
    type: "cpu",
    socket: "LGA1700",
    cores: 6,
    threads: 12,
    tdpWatts: 65,
  },
];

const gpuProducts: GpuProduct[] = [
  {
    id: "gpu-4060",
    slug: "nvidia-rtx-4060",
    name: "NVIDIA RTX 4060 8GB",
    brand: "NVIDIA",
    priceCents: 32900,
    image: "/components/gpu/1669-gigabyte-geforce-rtx-4060-gaming-oc-8gb-gddr6-dlss3-ad8a0641-2fbd-41d5-8da1-bb347989fbeb.webp",
    description: "Muy buena para 1080p alto.",
    type: "gpu",
    vramGb: 8,
    tdpWatts: 115,
  },
  {
    id: "gpu-4060ti",
    slug: "nvidia-rtx-4060-ti",
    name: "NVIDIA RTX 4060 Ti 8GB",
    brand: "NVIDIA",
    priceCents: 42900,
    image: "/components/gpu/1782-gigabyte-geforce-rtx-4060-ti-eagle-oc-8gb-gddr6.webp",
    description: "Más margen en 1080p ultra y 1440p.",
    type: "gpu",
    vramGb: 8,
    tdpWatts: 160,
  },
  {
    id: "gpu-4070",
    slug: "nvidia-rtx-4070",
    name: "NVIDIA RTX 4070 12GB",
    brand: "NVIDIA",
    priceCents: 57900,
    image: "/components/gpu/1556-gigabyte-geforce-rtx-4070-windforce-oc-12gb-gddr6x-dlss3.webp",
    description: "Excelente para 1440p.",
    type: "gpu",
    vramGb: 12,
    tdpWatts: 200,
  },
  {
    id: "gpu-4070s",
    slug: "nvidia-rtx-4070-super",
    name: "NVIDIA RTX 4070 SUPER",
    brand: "NVIDIA",
    priceCents: 64900,
    image: "/components/gpu/shopping.webp",
    description: "GPU potente para 1440p con ray tracing.",
    type: "gpu",
    vramGb: 12,
    tdpWatts: 220,
  },
  {
    id: "gpu-4070ti-s",
    slug: "nvidia-rtx-4070-ti-super",
    name: "NVIDIA RTX 4070 Ti SUPER",
    brand: "NVIDIA",
    priceCents: 87900,
    image: "/components/gpu/1151-asus-tuf-gaming-geforce-rtx-4070-ti-super-btf-white-oc-edition-16gb-gddr6x-dlss3.webp",
    description: "Rendimiento alto en 1440p/4K.",
    type: "gpu",
    vramGb: 16,
    tdpWatts: 285,
  },
  {
    id: "gpu-4080s",
    slug: "nvidia-rtx-4080-super",
    name: "NVIDIA RTX 4080 SUPER",
    brand: "NVIDIA",
    priceCents: 112900,
    image: "/components/gpu/1906-asus-proart-geforce-rtx-4080-16gb-oc-edition-gddr6x-dlss3.webp",
    description: "4K premium para exigentes.",
    type: "gpu",
    vramGb: 16,
    tdpWatts: 320,
  },
  {
    id: "gpu-7600",
    slug: "amd-rx-7600",
    name: "AMD Radeon RX 7600",
    brand: "AMD",
    priceCents: 29900,
    image: "/components/gpu/1741-gigabyte-radeon-rx-7600-gaming-oc-8gb-gddr6.jpg",
    description: "Gran opción precio/rendimiento 1080p.",
    type: "gpu",
    vramGb: 8,
    tdpWatts: 165,
  },
  {
    id: "gpu-7700xt",
    slug: "amd-rx-7700-xt",
    name: "AMD Radeon RX 7700 XT",
    brand: "AMD",
    priceCents: 44900,
    image: "/components/gpu/2648997-amd-radeon-7700xt.avif",
    description: "Muy sólida para 1440p.",
    type: "gpu",
    vramGb: 12,
    tdpWatts: 245,
  },
  {
    id: "gpu-7800xt",
    slug: "amd-rx-7800-xt",
    name: "AMD Radeon RX 7800 XT",
    brand: "AMD",
    priceCents: 53900,
    image: "/components/gpu/PROD-045842_1.jpg",
    description: "1440p alto con buena eficiencia.",
    type: "gpu",
    vramGb: 16,
    tdpWatts: 263,
  },
  {
    id: "gpu-7900gre",
    slug: "amd-rx-7900-gre",
    name: "AMD Radeon RX 7900 GRE",
    brand: "AMD",
    priceCents: 61900,
    image: "/components/gpu/2648997-amd-radeon-7900gre.avif",
    description: "Excelente valor para 1440p/4K inicial.",
    type: "gpu",
    vramGb: 16,
    tdpWatts: 260,
  },
  {
    id: "gpu-7900xt",
    slug: "amd-rx-7900-xt",
    name: "AMD Radeon RX 7900 XT",
    brand: "AMD",
    priceCents: 78900,
    image: "/components/gpu/2648997-amd-radeon-7900xt.avif",
    description: "Alto rendimiento para 4K.",
    type: "gpu",
    vramGb: 20,
    tdpWatts: 315,
  },
  {
    id: "gpu-7900xtx",
    slug: "amd-rx-7900-xtx",
    name: "AMD Radeon RX 7900 XTX",
    brand: "AMD",
    priceCents: 99900,
    image: "/components/gpu/2648997-amd-radeon-7900xtx.avif",
    description: "GPU tope para 4K competitivo.",
    type: "gpu",
    vramGb: 24,
    tdpWatts: 355,
  },
];

const rawMotherboardProducts: Omit<MotherboardProduct, "formFactor">[] = [
  { id: "mb-b650", slug: "asus-tuf-b650-plus", name: "ASUS TUF B650-PLUS", brand: "ASUS", priceCents: 21900, image: "/components/motherboard/1481-asus-tuf-gaming-b650e-plus-wifi-pcie-50.webp", description: "AM5 DDR5 con gran relación calidad/precio.", type: "motherboard", socket: "AM5", memoryType: "DDR5", maxMemoryGb: 192, m2Slots: 3, sataPorts: 4 },
  { id: "mb-b650e", slug: "asrock-b650e-steel-legend", name: "ASRock B650E Steel Legend", brand: "ASRock", priceCents: 25900, image: "/components/motherboard/1224-asrock-b650e-steel-legend-wifi.webp", description: "AM5 con PCIe 5.0 y buena conectividad.", type: "motherboard", socket: "AM5", memoryType: "DDR5", maxMemoryGb: 192, m2Slots: 3, sataPorts: 4 },
  { id: "mb-x670e-aorus", slug: "gigabyte-x670e-aorus-elite", name: "Gigabyte X670E AORUS Elite", brand: "Gigabyte", priceCents: 35900, image: "/components/motherboard/1355-placa-base-gigabyte-x870e-aorus-elite-x3d-x870e-am5-ddr5-atx-wifi-7-usb4-pcie-50-rgb-review.webp", description: "Placa AM5 de gama alta.", type: "motherboard", socket: "AM5", memoryType: "DDR5", maxMemoryGb: 192, m2Slots: 4, sataPorts: 4 },
  { id: "mb-x670e-hero", slug: "asus-rog-x670e-hero", name: "ASUS ROG X670E Hero", brand: "ASUS", priceCents: 58900, image: "/components/motherboard/1262-asus-rog-crosshair-x870e-hero.webp", description: "Top AM5 para overclock y expansión.", type: "motherboard", socket: "AM5", memoryType: "DDR5", maxMemoryGb: 192, m2Slots: 5, sataPorts: 6 },
  { id: "mb-b650m", slug: "msi-pro-b650m-a", name: "MSI PRO B650M-A", brand: "MSI", priceCents: 17900, image: "/components/motherboard/1187-msi-pro-b650m-a-wifi.webp", description: "Formato mATX AM5 compacto.", type: "motherboard", socket: "AM5", memoryType: "DDR5", maxMemoryGb: 128, m2Slots: 2, sataPorts: 4 },
  { id: "mb-z790", slug: "msi-pro-z790-p", name: "MSI PRO Z790-P", brand: "MSI", priceCents: 24900, image: "/components/motherboard/1564-msi-pro-z790-p-wifi-review.webp", description: "LGA1700 DDR5 con buena conectividad.", type: "motherboard", socket: "LGA1700", memoryType: "DDR5", maxMemoryGb: 192, m2Slots: 4, sataPorts: 6 },
  { id: "mb-z790-aorus", slug: "gigabyte-z790-aorus-elite", name: "Gigabyte Z790 AORUS Elite", brand: "Gigabyte", priceCents: 31900, image: "/components/motherboard/14-gigabyte-z790-aorus-elite-ax.webp", description: "LGA1700 para alto rendimiento.", type: "motherboard", socket: "LGA1700", memoryType: "DDR5", maxMemoryGb: 192, m2Slots: 4, sataPorts: 6 },
  { id: "mb-z790-rog", slug: "asus-rog-z790-f", name: "ASUS ROG Z790-F", brand: "ASUS", priceCents: 45900, image: "/components/motherboard/1259-asus-rog-strix-z790-f-gaming-wifi.webp", description: "Z790 premium para i7/i9.", type: "motherboard", socket: "LGA1700", memoryType: "DDR5", maxMemoryGb: 192, m2Slots: 5, sataPorts: 6 },
  { id: "mb-b760-ddr5", slug: "msi-b760-gaming-plus-ddr5", name: "MSI B760 Gaming Plus DDR5", brand: "MSI", priceCents: 19900, image: "/components/motherboard/1162-placa-base-msi-b760-gaming-plus-wifi-b760-lga-1700-ddr5-atx-wifi-6e-25gbe-m2-raid.webp", description: "B760 equilibrada con DDR5.", type: "motherboard", socket: "LGA1700", memoryType: "DDR5", maxMemoryGb: 192, m2Slots: 3, sataPorts: 4 },
  { id: "mb-b760-ddr4", slug: "asus-prime-b760-plus-ddr4", name: "ASUS PRIME B760-PLUS DDR4", brand: "ASUS", priceCents: 16900, image: "/components/motherboard/1800-asus-prime-b760-plus-d4.webp", description: "B760 económica con DDR4.", type: "motherboard", socket: "LGA1700", memoryType: "DDR4", maxMemoryGb: 128, m2Slots: 2, sataPorts: 4 },
  { id: "mb-h610", slug: "gigabyte-h610m-h-v2", name: "Gigabyte H610M H V2", brand: "Gigabyte", priceCents: 9900, image: "/components/motherboard/4269-placa-base-gigabyte-h610m-h-v2-ddr5-lga-1700-micro-atx-m2-sata-iii-96gb-especificaciones.webp", description: "Entrada LGA1700 para builds económicas.", type: "motherboard", socket: "LGA1700", memoryType: "DDR4", maxMemoryGb: 64, m2Slots: 1, sataPorts: 4 },
  { id: "mb-z690-ddr5", slug: "asrock-z690-steel-legend-ddr5", name: "ASRock Z690 Steel Legend DDR5", brand: "ASRock", priceCents: 23900, image: "/components/motherboard/1702-placa-base-asrock-z890-steel-legend-wifi-lga1851-ddr5-256gb-wi-fi-7-atx-overclock-opiniones.webp", description: "Z690 con DDR5 y buena expansión.", type: "motherboard", socket: "LGA1700", memoryType: "DDR5", maxMemoryGb: 128, m2Slots: 3, sataPorts: 6 },
  { id: "mb-z690-ddr4", slug: "msi-z690-a-pro-ddr4", name: "MSI Z690-A PRO DDR4", brand: "MSI", priceCents: 20900, image: "/components/motherboard/135-msi-pro-z690-a-wifi.webp", description: "Z690 para memorias DDR4.", type: "motherboard", socket: "LGA1700", memoryType: "DDR4", maxMemoryGb: 128, m2Slots: 3, sataPorts: 6 },
  { id: "mb-b550", slug: "msi-b550-tomahawk", name: "MSI B550 Tomahawk", brand: "MSI", priceCents: 15900, image: "/components/motherboard/1130-msi-mag-b550-tomahawk.webp", description: "AM4 confiable para Ryzen 5000.", type: "motherboard", socket: "AM4", memoryType: "DDR4", maxMemoryGb: 128, m2Slots: 2, sataPorts: 6 },
  { id: "mb-b550m", slug: "asus-tuf-b550m-plus", name: "ASUS TUF B550M-PLUS", brand: "ASUS", priceCents: 12900, image: "/components/motherboard/1883-asus-tuf-gaming-b550m-plus-opiniones.webp", description: "AM4 mATX robusta y compacta.", type: "motherboard", socket: "AM4", memoryType: "DDR4", maxMemoryGb: 128, m2Slots: 2, sataPorts: 4 },
  { id: "mb-a520", slug: "asrock-a520m-pro4", name: "ASRock A520M Pro4", brand: "ASRock", priceCents: 8900, image: "/components/motherboard/1730-asrock-a520m-pro4.webp", description: "AM4 de entrada para presupuestos ajustados.", type: "motherboard", socket: "AM4", memoryType: "DDR4", maxMemoryGb: 64, m2Slots: 1, sataPorts: 4 },
  { id: "mb-b450", slug: "asus-prime-b450m-a-ii", name: "ASUS PRIME B450M-A II", brand: "ASUS", priceCents: 7900, image: "/components/motherboard/1776-asus-prime-b450m-a-ii.webp", description: "Placa AM4 clásica y económica.", type: "motherboard", socket: "AM4", memoryType: "DDR4", maxMemoryGb: 64, m2Slots: 1, sataPorts: 4 },
  { id: "mb-x670e-carbon", slug: "msi-mpg-x670e-carbon", name: "MSI MPG X670E Carbon", brand: "MSI", priceCents: 51900, image: "/components/motherboard/1727-msi-mpg-x670e-carbon-wifi.webp", description: "AM5 premium enfocada en overclock.", type: "motherboard", socket: "AM5", memoryType: "DDR5", maxMemoryGb: 192, m2Slots: 5, sataPorts: 6 },
  { id: "mb-b650-gaming-x", slug: "gigabyte-b650-gaming-x-ax", name: "Gigabyte B650 Gaming X AX", brand: "Gigabyte", priceCents: 22900, image: "/components/motherboard/1793-gigabyte-b650-gaming-x-ax-v2-opiniones.webp", description: "AM5 equilibrada para gaming actual.", type: "motherboard", socket: "AM5", memoryType: "DDR5", maxMemoryGb: 192, m2Slots: 3, sataPorts: 4 },
];

function inferMotherboardFormFactor(motherboardSlug: string): FormFactor {
  const normalizedSlug = motherboardSlug.toLowerCase();
  if (normalizedSlug.includes("xl-atx") || normalizedSlug.includes("xlatx")) {
    return "XL-ATX";
  }

  if (normalizedSlug.includes("e-atx") || normalizedSlug.includes("eatx")) {
    return "E-ATX";
  }

  if (normalizedSlug.includes("mini-itx") || normalizedSlug.includes("itx")) {
    return "Mini-ITX";
  }

  if (
    normalizedSlug.includes("h610m") ||
    normalizedSlug.includes("b450m") ||
    normalizedSlug.includes("a520m") ||
    normalizedSlug.includes("b550m") ||
    normalizedSlug.includes("b650m")
  ) {
    return "mATX";
  }

  return "ATX";
}

const motherboardProducts: MotherboardProduct[] = rawMotherboardProducts.map(
  (product) => ({
    ...product,
    formFactor: inferMotherboardFormFactor(product.slug),
  }),
);

const memoryProducts: MemoryProduct[] = [
  { id: "ram-ddr5-16-5600", slug: "corsair-vengeance-16-ddr5-5600", name: "Corsair Vengeance 16GB (1x16GB) DDR5 5600", brand: "Corsair", priceCents: 6900, image: "/components/ram/Vengeance-DDR5-1UP-16GB-BLACK_01.avif", description: "Kit básico DDR5 para entrada.", type: "memory", memoryType: "DDR5", speedMhz: 5600, capacityGb: 16, modules: 2 },
  { id: "ram-ddr5-32-5600", slug: "corsair-vengeance-32-ddr5-5600", name: "Corsair Vengeance 32GB (1x32GB) DDR5 5600", brand: "Corsair", priceCents: 10900, image: "/components/ram/Vengeance-DDR5-1UP-32GB-BLACK_01.avif", description: "32GB DDR5 equilibrados.", type: "memory", memoryType: "DDR5", speedMhz: 5600, capacityGb: 32, modules: 2 },
  { id: "ram-ddr5-32-6000", slug: "corsair-vengeance-32-ddr5-6000", name: "Corsair Vengeance 32GB (2x16GB) DDR5 6000", brand: "Corsair", priceCents: 12900, image: "/components/ram/VENGEANCE_DDR5_GREY_AMD_01.avif", description: "Ideal para gaming en AM5.", type: "memory", memoryType: "DDR5", speedMhz: 6000, capacityGb: 32, modules: 2 },
  { id: "ram-ddr5-64-6000", slug: "corsair-vengeance-64-ddr5-6000", name: "Corsair Vengeance 64GB (2x32GB) DDR5 6000", brand: "Corsair", priceCents: 21900, image: "/components/ram/CMK64GX5M2B5600Z36_01.avif", description: "64GB para multitarea y creación.", type: "memory", memoryType: "DDR5", speedMhz: 6000, capacityGb: 64, modules: 2 },
  { id: "ram-ddr5-32-6400", slug: "gskill-trident-z5-32-ddr5-6400", name: "G.Skill Trident Z5 32GB (2x16GB) DDR5 6400", brand: "G.Skill", priceCents: 15900, image: "/components/ram/120-gskill-trident-z5-rgb-ddr5-6400mhz-32gb-2x16gb-cl32.webp", description: "Frecuencia alta para entusiastas.", type: "memory", memoryType: "DDR5", speedMhz: 6400, capacityGb: 32, modules: 2 },
  { id: "ram-ddr5-64-6400", slug: "gskill-trident-z5-64-ddr5-6400", name: "G.Skill Trident Z5 64GB (2x32GB) DDR5 6400", brand: "G.Skill", priceCents: 29900, image: "/components/ram/1925-gskill-trident-z5-rgb-ddr5-6400mhz-64gb-2x32gb-cl32-intel-xmp-30.webp", description: "Rendimiento alto en gran capacidad.", type: "memory", memoryType: "DDR5", speedMhz: 6400, capacityGb: 64, modules: 2 },
  { id: "ram-ddr5-96-6000", slug: "kingston-fury-96-ddr5-6000", name: "Kingston Fury 96GB (2x48GB) DDR5 6000", brand: "Kingston", priceCents: 37900, image: "/components/ram/1145-kingston-fury-renegade-ddr5-6000mhz-96gb-2x48gb-cl32-plata-intel-xmp.webp", description: "Capacidad extrema para workstation.", type: "memory", memoryType: "DDR5", speedMhz: 6000, capacityGb: 96, modules: 2 },
  { id: "ram-ddr5-16-6000", slug: "kingston-fury-16-ddr5-6000", name: "Kingston Fury 16GB (1x16GB) DDR5 6000", brand: "Kingston", priceCents: 7900, image: "/components/ram/14-memoria-ram-kingston-fury-beast-16gb-1x16gb-ddr5-6000mhz-cl30-amd-expo-negro.webp", description: "Kit DDR5 económico y rápido.", type: "memory", memoryType: "DDR5", speedMhz: 6000, capacityGb: 16, modules: 2 },
  { id: "ram-ddr5-32-7200", slug: "teamgroup-tforce-32-ddr5-7200", name: "TeamGroup T-Force 32GB (2x16GB) DDR5 7200", brand: "TeamGroup", priceCents: 18900, image: "/components/ram/1225-team-group-delta-white-rgb-ddr5-7200mhz-32gb-2x16gb-cl34.webp", description: "Memoria de alta frecuencia.", type: "memory", memoryType: "DDR5", speedMhz: 7200, capacityGb: 32, modules: 2 },
  { id: "ram-ddr5-48-6800", slug: "patriot-viper-48-ddr5-6800", name: "Patriot Viper 48GB (2x24GB) DDR5 6800", brand: "Patriot", priceCents: 22900, image: "/components/ram/1135-memoria-ram-patriot-viper-elite-5-ultra-48gb-2x24gb-ddr5-6000mhz-cl28-rgb-xmp-expo.jpg", description: "Capacidad y velocidad equilibradas.", type: "memory", memoryType: "DDR5", speedMhz: 6800, capacityGb: 48, modules: 2 },
  { id: "ram-ddr4-16-3200", slug: "kingston-fury-16-ddr4-3200", name: "Kingston Fury 16GB (1x16GB) DDR4 3200", brand: "Kingston", priceCents: 4900, image: "/components/ram/1320-memoria-ram-kingston-fury-renegade-rgb-16gb-1x16gb-ddr4-3200mhz-cl16-intel-xmp-rgb-negro.webp", description: "DDR4 básica para equipos económicos.", type: "memory", memoryType: "DDR4", speedMhz: 3200, capacityGb: 16, modules: 2 },
  { id: "ram-ddr4-32-3200", slug: "kingston-fury-32-ddr4-3200", name: "Kingston Fury 32GB (1x32GB) DDR4 3200", brand: "Kingston", priceCents: 7900, image: "/components/ram/1937-memoria-ram-kingston-32gb-ddr4-3200mt-s-fury-beast-rgb.webp", description: "32GB DDR4 asequibles.", type: "memory", memoryType: "DDR4", speedMhz: 3200, capacityGb: 32, modules: 2 },
  { id: "ram-ddr4-32-3600", slug: "kingston-fury-32-ddr4-3600", name: "Kingston Fury 32GB (2x16GB) DDR4 3600", brand: "Kingston", priceCents: 9900, image: "/componenets/ram/1986-memoria-ram-kingston-fury-beast-rgb-32gb-2x16gb-ddr4-3600mhz-cl18-intel-xmp-rgb-negro.webp", description: "DDR4 rápida para gaming.", type: "memory", memoryType: "DDR4", speedMhz: 3600, capacityGb: 32, modules: 2 },
  { id: "ram-ddr4-64-3600", slug: "kingston-fury-64-ddr4-3600", name: "Kingston Fury 64GB (2x32GB) DDR4 3600", brand: "Kingston", priceCents: 17900, image: "/components/ram/1483-kingston-fury-beast-ddr4-3600-mhz-64gb-2x32gb-cl18.webp", description: "Gran capacidad DDR4.", type: "memory", memoryType: "DDR4", speedMhz: 3600, capacityGb: 64, modules: 2 },
  { id: "ram-ddr4-16-3600", slug: "corsair-lpx-16-ddr4-3600", name: "Corsair LPX 16GB (2x8GB) DDR4 3600", brand: "Corsair", priceCents: 5400, image: "/components/ram/1.webp", description: "Perfil bajo para torres compactas.", type: "memory", memoryType: "DDR4", speedMhz: 3600, capacityGb: 16, modules: 2 },
  { id: "ram-ddr4-32-4000", slug: "corsair-lpx-32-ddr4-4000", name: "Corsair LPX 32GB (2x16GB) DDR4 4000", brand: "Corsair", priceCents: 11900, image: "/components/ram/1843-memoria-ram-corsair-vengeance-lpx-cmk32gx4m2e3200c16w-32gb-2x16gb-ddr4-3200mhz-cl16-disipador-blanco-intel-xmp-7a10c2bc-da16-4bc2-8efb-b15cc2a93745.webp", description: "DDR4 de mayor frecuencia.", type: "memory", memoryType: "DDR4", speedMhz: 4000, capacityGb: 32, modules: 2 },
  { id: "ram-ddr4-64-3200", slug: "gskill-ripjaws-64-ddr4-3200", name: "G.Skill Ripjaws 64GB (4x16GB) DDR4 3200", brand: "G.Skill", priceCents: 15900, image: "/components/ram/1313-gskill-ripjaws-v-ddr4-3200mhz-pc4-25600-64gb-4x16gb-cl16.webp", description: "Capacidad alta para workstation DDR4.", type: "memory", memoryType: "DDR4", speedMhz: 3200, capacityGb: 64, modules: 2 },
  { id: "ram-ddr4-32-4400", slug: "patriot-viper-32-ddr4-4400", name: "Patriot Viper 32GB (2x16GB) DDR4 4400", brand: "Patriot", priceCents: 14900, image: "/components/ram/1194-memoria-ram-patriot-viper-steel-pvsr432g360c8k-32gb-2x16gb-ddr4-3600mhz-cl18-rgb-intel-xmp.jpg", description: "DDR4 orientada a overclock.", type: "memory", memoryType: "DDR4", speedMhz: 4400, capacityGb: 32, modules: 2 },
  { id: "ram-ddr4-32-3000", slug: "teamgroup-elite-32-ddr4-3000", name: "TeamGroup Elite 32GB (1x32GB) DDR4 3000", brand: "TeamGroup", priceCents: 6900, image: "/components/ram/1611-memoria-ram-team-group-32gb-ddr4-3200mhz-elite-ted432g3200c2201.webp", description: "Memoria asequible para uso general.", type: "memory", memoryType: "DDR4", speedMhz: 3000, capacityGb: 32, modules: 2 },
  { id: "ram-ddr4-128-3200", slug: "crucial-pro-128-ddr4-3200", name: "Crucial Pro 128GB (2x64GB) DDR4 3200", brand: "Crucial", priceCents: 31900, image: "/components/ram/1669-crucial-pro-ddr4-3200mhz-64gb-2x32gb-cl22-intel-xmp-20.webp", description: "Máxima capacidad en DDR4.", type: "memory", memoryType: "DDR4", speedMhz: 3200, capacityGb: 128, modules: 4 },
];

const storageProducts: StorageProduct[] = [
  { id: "sto-500-nvme", slug: "wd-sn770-500gb", name: "WD Black SN770 500GB", brand: "WD", priceCents: 5900, image: "/components/storage/1923-wd-black-sn770m-500gb-ssd-m2-pcie-gen4-nvme-2230-mejor-precio.webp", description: "NVMe rápido para sistema operativo.", type: "storage", interface: "M2_NVME", capacityGb: 500 },
  { id: "sto-1tb-nvme", slug: "samsung-990-evo-1tb", name: "Samsung 990 EVO 1TB", brand: "Samsung", priceCents: 10900, image: "/components/storage/1839-samsung-990-evo-1tb-ssd-m2-pcie-40-x4-50-x2-nvme-20.webp", description: "SSD NVMe rápido para SO y juegos.", type: "storage", interface: "M2_NVME", capacityGb: 1000 },
  { id: "sto-2tb-nvme", slug: "samsung-990-pro-2tb", name: "Samsung 990 PRO 2TB", brand: "Samsung", priceCents: 17900, image: "/components/storage/1952-samsung-990-pro-2tb-ssd-pcie-40-nvme-m2.webp", description: "NVMe premium de alto rendimiento.", type: "storage", interface: "M2_NVME", capacityGb: 2000 },
  { id: "sto-4tb-nvme", slug: "wd-sn850x-4tb", name: "WD Black SN850X 4TB", brand: "WD", priceCents: 32900, image: "/components/storage/1199-disco-duro-wd-black-sn850x-4tb-ssd-m2-7300-mb-s-con-disipador.jpg", description: "Gran capacidad en M.2 NVMe.", type: "storage", interface: "M2_NVME", capacityGb: 4000 },
  { id: "sto-1tb-p3plus", slug: "crucial-p3-plus-1tb", name: "Crucial P3 Plus 1TB", brand: "Crucial", priceCents: 8900, image: "/components/storage/1817-crucial-p3-plus-1tb-ssd-m2-3d-nand-nvme-pcie-40.webp", description: "NVMe equilibrado para gaming.", type: "storage", interface: "M2_NVME", capacityGb: 1000 },
  { id: "sto-2tb-p3plus", slug: "crucial-p3-plus-2tb", name: "Crucial P3 Plus 2TB", brand: "Crucial", priceCents: 14900, image: "/components/storage/1351-crucial-p3-plus-2tb-ssd-m2-3d-nand-nvme-pcie-40.webp", description: "Buena capacidad NVMe a buen precio.", type: "storage", interface: "M2_NVME", capacityGb: 2000 },
  { id: "sto-2tb-980pro", slug: "samsung-980-pro-2tb", name: "Samsung 980 PRO 2TB", brand: "Samsung", priceCents: 16900, image: "/components/storage/1249-samsung-980-pro-ssd-2tb-pcie-40-nvme-m2.webp", description: "NVMe de alto rendimiento sostenido.", type: "storage", interface: "M2_NVME", capacityGb: 2000 },
  { id: "sto-500-980", slug: "samsung-980-500gb", name: "Samsung 980 500GB", brand: "Samsung", priceCents: 6500, image: "/components/storage/1882-samsung-980-ssd-500gb-pcie-30-nvme-m2.webp", description: "M.2 NVMe compacto y fiable.", type: "storage", interface: "M2_NVME", capacityGb: 500 },
  { id: "sto-1tb-kc3000", slug: "kingston-kc3000-1tb", name: "Kingston KC3000 1TB", brand: "Kingston", priceCents: 10500, image: "/components/storage/1792-kingston-kc3000-ssd-1tb-m2-pcie-40-nvme-especificaciones.webp", description: "NVMe veloz para juegos y apps.", type: "storage", interface: "M2_NVME", capacityGb: 1000 },
  { id: "sto-2tb-kc3000", slug: "kingston-kc3000-2tb", name: "Kingston KC3000 2TB", brand: "Kingston", priceCents: 16900, image: "/components/storage/1721-kingston-kc3000-ssd-2tb-m2-pcie-40-nvme.webp", description: "Alto rendimiento en 2TB.", type: "storage", interface: "M2_NVME", capacityGb: 2000 },
  { id: "sto-1tb-sata", slug: "crucial-p510-1tb", name: "Crucial P510 1TB", brand: "Crucial", priceCents: 7900, image: "/components/storage/1699-disco-duro-crucial-1tb-ssd-m2-pcie-50-11000mb-s-p5-plus-para-gaming-y-pc.webp", description: "SSD SATA fiable y duradero.", type: "storage", interface: "SATA", capacityGb: 1000 },
  { id: "sto-2tb-sata", slug: "crucial-p510-2tb", name: "Crucial P510 2TB", brand: "Crucial", priceCents: 11900, image: "/components/storage/1699-disco-duro-crucial-1tb-ssd-m2-pcie-50-11000mb-s-p5-plus-para-gaming-y-pc.webp", description: "SSD SATA fiable para almacenamiento masivo.", type: "storage", interface: "SATA", capacityGb: 2000 },
  { id: "sto-4tb-sata", slug: "crucial-p510-4tb", name: "Crucial P510 4TB", brand: "Crucial", priceCents: 24900, image: "/components/storage/1699-disco-duro-crucial-1tb-ssd-m2-pcie-50-11000mb-s-p5-plus-para-gaming-y-pc.webp", description: "Mucho almacenamiento SATA.", type: "storage", interface: "SATA", capacityGb: 4000 },
  { id: "sto-500-sata", slug: "samsung-870-evo-500gb", name: "Samsung 870 EVO 500GB", brand: "Samsung", priceCents: 5500, image: "/components/storage/1786-samsung-870-qvo-ssd-25-500gb-sata3-negro.webp", description: "SATA compacto y eficiente.", type: "storage", interface: "SATA", capacityGb: 500 },
  { id: "sto-1tb-870", slug: "samsung-870-evo-1tb", name: "Samsung 870 EVO 1TB", brand: "Samsung", priceCents: 8900, image: "/components/storage/1786-samsung-870-qvo-ssd-25-500gb-sata3-negro.webp", description: "SATA premium para uso diario.", type: "storage", interface: "SATA", capacityGb: 1000 },
  { id: "sto-2tb-870", slug: "samsung-870-evo-2tb", name: "Samsung 870 EVO 2TB", brand: "Samsung", priceCents: 13900, image: "/components/storage/1786-samsung-870-qvo-ssd-25-500gb-sata3-negro.webp", description: "Más espacio con fiabilidad Samsung.", type: "storage", interface: "SATA", capacityGb: 2000 },
  { id: "sto-1tb-wdblue", slug: "wd-blue-sa510-1tb", name: "WD Blue SA510 1TB", brand: "WD", priceCents: 7600, image: "/components/storage/1585-wd-blue-sa510-25-1tb-ssd-sata-3.webp", description: "SATA equilibrado para upgrades.", type: "storage", interface: "SATA", capacityGb: 1000 },
  { id: "sto-2tb-wdblue", slug: "wd-blue-sa510-2tb", name: "WD Blue SA510 2TB", brand: "WD", priceCents: 12900, image: "/components/storage/1835-wd-blue-sa510-25-2tb-ssd-sata-3.webp", description: "Capacidad SATA para bibliotecas grandes.", type: "storage", interface: "SATA", capacityGb: 2000 },
  { id: "sto-4tb-wdblue", slug: "wd-blue-sa510-4tb", name: "WD Blue SA510 4TB", brand: "WD", priceCents: 22900, image: "/components/storage/192-wd-blue-sa510-25-4tb-ssd-sata-3.webp", description: "4TB SATA para almacenamiento pesado.", type: "storage", interface: "SATA", capacityGb: 4000 },
  { id: "sto-8tb-sata", slug: "seagate-barracuda-ssd-8tb", name: "Seagate BarraCuda SSD 8TB", brand: "Seagate", priceCents: 49900, image: "/components/storage/fsd.webp", description: "SATA masivo para proyectos grandes.", type: "storage", interface: "SATA", capacityGb: 8000 },
];

const psuProducts: PsuProduct[] = [
  { id: "psu-550-bronze", slug: "corsair-cx550", name: "Corsair CX550", brand: "Corsair", priceCents: 5900, image: psuImage, description: "Fuente 550W 80+ Bronze fiable.", type: "psu", wattage: 550, efficiency: "80+ Bronze" },
  { id: "psu-650-bronze", slug: "corsair-cx650", name: "Corsair CX650", brand: "Corsair", priceCents: 6900, image: psuImage, description: "650W Bronze para gama media.", type: "psu", wattage: 650, efficiency: "80+ Bronze" },
  { id: "psu-750-bronze", slug: "corsair-cx750", name: "Corsair CX750", brand: "Corsair", priceCents: 7900, image: psuImage, description: "750W Bronze para builds potentes.", type: "psu", wattage: 750, efficiency: "80+ Bronze" },
  { id: "psu-850-bronze", slug: "corsair-cx850", name: "Corsair CX850", brand: "Corsair", priceCents: 9900, image: psuImage, description: "850W Bronze para GPUs exigentes.", type: "psu", wattage: 850, efficiency: "80+ Bronze" },
  { id: "psu-550-gold", slug: "bequiet-pure-power-12m-550", name: "be quiet! Pure Power 12M 550W", brand: "be quiet!", priceCents: 9900, image: psuImage, description: "Silenciosa y eficiente.", type: "psu", wattage: 550, efficiency: "80+ Gold" },
  { id: "psu-650-gold", slug: "bequiet-pure-power-12m-650", name: "be quiet! Pure Power 12M 650W", brand: "be quiet!", priceCents: 10900, image: psuImage, description: "Fuente Gold modular equilibrada.", type: "psu", wattage: 650, efficiency: "80+ Gold" },
  { id: "psu-750-gold", slug: "corsair-rm750e", name: "Corsair RM750e", brand: "Corsair", priceCents: 12900, image: psuImage, description: "Fuente 750W 80+ Gold silenciosa y estable.", type: "psu", wattage: 750, efficiency: "80+ Gold" },
  { id: "psu-850-gold", slug: "corsair-rm850e", name: "Corsair RM850e", brand: "Corsair", priceCents: 14900, image: psuImage, description: "850W Gold para equipos potentes.", type: "psu", wattage: 850, efficiency: "80+ Gold" },
  { id: "psu-1000-gold", slug: "corsair-rm1000e", name: "Corsair RM1000e", brand: "Corsair", priceCents: 18900, image: psuImage, description: "1000W Gold para setups avanzados.", type: "psu", wattage: 1000, efficiency: "80+ Gold" },
  { id: "psu-1200-gold", slug: "corsair-rm1200e", name: "Corsair RM1200e", brand: "Corsair", priceCents: 23900, image: psuImage, description: "1200W Gold para overclock extremo.", type: "psu", wattage: 1200, efficiency: "80+ Gold" },
  { id: "psu-650-gold-focus", slug: "seasonic-focus-gx-650", name: "Seasonic Focus GX-650", brand: "Seasonic", priceCents: 11900, image: psuImage, description: "Calidad Seasonic en 650W.", type: "psu", wattage: 650, efficiency: "80+ Gold" },
  { id: "psu-750-gold-focus", slug: "seasonic-focus-gx-750", name: "Seasonic Focus GX-750", brand: "Seasonic", priceCents: 13900, image: psuImage, description: "Fuente Gold muy estable.", type: "psu", wattage: 750, efficiency: "80+ Gold" },
  { id: "psu-850-gold-focus", slug: "seasonic-focus-gx-850", name: "Seasonic Focus GX-850", brand: "Seasonic", priceCents: 16900, image: psuImage, description: "850W Gold de alta fiabilidad.", type: "psu", wattage: 850, efficiency: "80+ Gold" },
  { id: "psu-1000-gold-focus", slug: "seasonic-focus-gx-1000", name: "Seasonic Focus GX-1000", brand: "Seasonic", priceCents: 21900, image: psuImage, description: "1000W para configuraciones exigentes.", type: "psu", wattage: 1000, efficiency: "80+ Gold" },
  { id: "psu-750-platinum", slug: "seasonic-prime-px-750", name: "Seasonic PRIME PX-750", brand: "Seasonic", priceCents: 20900, image: psuImage, description: "Eficiencia Platinum en 750W.", type: "psu", wattage: 750, efficiency: "80+ Platinum" },
  { id: "psu-850-platinum", slug: "seasonic-prime-px-850", name: "Seasonic PRIME PX-850", brand: "Seasonic", priceCents: 23900, image: psuImage, description: "Platinum para equipos premium.", type: "psu", wattage: 850, efficiency: "80+ Platinum" },
  { id: "psu-1000-platinum", slug: "seasonic-prime-px-1000", name: "Seasonic PRIME PX-1000", brand: "Seasonic", priceCents: 28900, image: psuImage, description: "Platinum alta gama 1000W.", type: "psu", wattage: 1000, efficiency: "80+ Platinum" },
  { id: "psu-1200-platinum", slug: "seasonic-prime-px-1200", name: "Seasonic PRIME PX-1200", brand: "Seasonic", priceCents: 33900, image: psuImage, description: "Fuente Platinum para workstations.", type: "psu", wattage: 1200, efficiency: "80+ Platinum" },
  { id: "psu-850-gold-msi", slug: "msi-mpg-a850g", name: "MSI MPG A850G", brand: "MSI", priceCents: 15900, image: psuImage, description: "ATX 3.0 Gold para GPUs modernas.", type: "psu", wattage: 850, efficiency: "80+ Gold" },
  { id: "psu-1000-gold-msi", slug: "msi-mpg-a1000g", name: "MSI MPG A1000G", brand: "MSI", priceCents: 19900, image: psuImage, description: "1000W ATX 3.0 con buen margen.", type: "psu", wattage: 1000, efficiency: "80+ Gold" },
];

const caseProducts: CaseProduct[] = [
  { id: "case-4000d", slug: "corsair-4000d-airflow", name: "Corsair 4000D Airflow", brand: "Corsair", priceCents: 9900, image: caseImage, description: "Torre ATX con excelente flujo de aire.", type: "case", supportedFormFactors: ["ATX", "mATX", "Mini-ITX"] },
  { id: "case-h5-flow", slug: "nzxt-h5-flow", name: "NZXT H5 Flow", brand: "NZXT", priceCents: 10900, image: caseImage, description: "Caja moderna con buen cable management.", type: "case", supportedFormFactors: ["ATX", "mATX", "Mini-ITX"] },
  { id: "case-pop-air", slug: "fractal-pop-air", name: "Fractal Pop Air", brand: "Fractal", priceCents: 9500, image: caseImage, description: "Torre compacta y bien ventilada.", type: "case", supportedFormFactors: ["ATX", "mATX", "Mini-ITX"] },
  { id: "case-lancool-216", slug: "lian-li-lancool-216", name: "Lian Li Lancool 216", brand: "Lian Li", priceCents: 11900, image: caseImage, description: "Gran airflow para builds gaming.", type: "case", supportedFormFactors: ["ATX", "mATX", "Mini-ITX"] },
  { id: "case-5000d", slug: "corsair-5000d-airflow", name: "Corsair 5000D Airflow", brand: "Corsair", priceCents: 16900, image: caseImage, description: "Mid tower amplia para setups premium.", type: "case", supportedFormFactors: ["E-ATX", "ATX", "mATX", "Mini-ITX"] },
  { id: "case-define-7", slug: "fractal-define-7", name: "Fractal Define 7", brand: "Fractal", priceCents: 17900, image: caseImage, description: "Torre silenciosa de alta calidad.", type: "case", supportedFormFactors: ["E-ATX", "ATX", "mATX", "Mini-ITX"] },
  { id: "case-o11-dynamic", slug: "lian-li-o11-dynamic", name: "Lian Li O11 Dynamic", brand: "Lian Li", priceCents: 14900, image: caseImage, description: "Caja show-build con cristal templado.", type: "case", supportedFormFactors: ["E-ATX", "ATX", "mATX", "Mini-ITX"] },
  { id: "case-matx-205m", slug: "lian-li-lancool-205m", name: "Lian Li Lancool 205M", brand: "Lian Li", priceCents: 7900, image: caseImage, description: "Caja compacta para placas mATX.", type: "case", supportedFormFactors: ["mATX", "Mini-ITX"] },
  { id: "case-mini-nr200", slug: "cooler-master-nr200", name: "Cooler Master NR200", brand: "Cooler Master", priceCents: 8900, image: caseImage, description: "Formato pequeño para mini builds.", type: "case", supportedFormFactors: ["Mini-ITX"] },
  { id: "case-meshify-2", slug: "fractal-meshify-2", name: "Fractal Meshify 2", brand: "Fractal", priceCents: 15900, image: caseImage, description: "Torre premium con flujo de aire top.", type: "case", supportedFormFactors: ["ATX", "mATX", "Mini-ITX"] },
  { id: "case-o11-dynamic-xl", slug: "lian-li-o11-dynamic-xl", name: "Lian Li O11 Dynamic XL", brand: "Lian Li", priceCents: 21900, image: caseImage, description: "Chasis grande para placas XL-ATX.", type: "case", supportedFormFactors: ["XL-ATX", "E-ATX", "ATX", "mATX", "Mini-ITX"] },
];

export const products: Product[] = [
  ...cpuProducts,
  ...motherboardProducts,
  ...memoryProducts,
  ...storageProducts,
  ...gpuProducts,
  ...caseProducts,
  ...psuProducts,
];

export const faqEntries: FaqEntry[] = [
  {
    id: "faq-1",
    question: "¿Cómo sé si CPU y placa base son compatibles?",
    answer:
      "CPU y placa deben compartir el mismo socket (por ejemplo AM5 o LGA1700).",
  },
  {
    id: "faq-2",
    question: "¿Importa si mi RAM es DDR4 o DDR5?",
    answer:
      "Sí. La RAM debe coincidir exactamente con el estándar que soporta la placa base.",
  },
  {
    id: "faq-3",
    question: "¿Qué pasa si elijo un SSD M.2 y la placa no tiene slots M.2?",
    answer:
      "No funcionará directamente. Necesitas una placa con slots M.2 o elegir un SSD SATA.",
  },
  {
    id: "faq-4",
    question: "¿Cuánta potencia necesita la fuente de alimentación?",
    answer:
      "La fuente debe superar el consumo estimado total con margen de seguridad del 20%-30%.",
  },
];

export const productsByType = {
  cpu: products.filter((product) => product.type === "cpu"),
  motherboard: products.filter((product) => product.type === "motherboard"),
  memory: products.filter((product) => product.type === "memory"),
  storage: products.filter((product) => product.type === "storage"),
  gpu: products.filter((product) => product.type === "gpu"),
  case: products.filter((product) => product.type === "case"),
  psu: products.filter((product) => product.type === "psu"),
};

export function findProductById(id: string) {
  return products.find((product) => product.id === id);
}
