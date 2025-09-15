import { AllAppliances, Appliance, OverusedDevices } from "@/types/type";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const handleLogout = (): void => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};

export function convertToHoursMinutes(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours} H ${minutes} M`;
}

export function processAppliances(data: AllAppliances) {
  const parseNumbers = (arr: string[]) => arr.map(Number);

  // Parse numeric values
  const energyConsumption = parseNumbers(data["Energy Consumption (kWh)"]);
  const durationHours = parseNumbers(data["Duration (Hours)"]);
  //   const powerRating = parseNumbers(data["Power Rating (Watt)"]);
  //   const cost = parseNumbers(data["Cost (IDR)"]);

  // Jumlah total konsumsi energi
  const totalEnergyConsumption = energyConsumption.reduce(
    (sum, val) => sum + val,
    0
  );

  // Rata-rata konsumsi energi
  const averageEnergyConsumption =
    totalEnergyConsumption / energyConsumption.length;

  // Jumlah perangkat yang terhubung (Connected)
  const connectedDevicesCount = data["Connectivity Status"].filter(
    (status) => status === "Connected"
  ).length;

  // Perangkat dengan konsumsi energi tertinggi
  const maxEnergyIndex = energyConsumption.indexOf(
    Math.max(...energyConsumption)
  );
  const maxEnergyDevice = {
    "Device Name": data["Device Name"][maxEnergyIndex],
    "Device Type": data["Device Type"][maxEnergyIndex],
    "Energy Consumption (kWh)": energyConsumption[maxEnergyIndex],
  };

  // Durasi pemakaian perangkat terlama
  const maxDurationIndex = durationHours.indexOf(Math.max(...durationHours));
  const maxDurationDevice = {
    "Device Name": data["Device Name"][maxDurationIndex],
    "Device Type": data["Device Type"][maxDurationIndex],
    "Duration (Hours)": durationHours[maxDurationIndex],
  };

  // Rincian perangkat di lokasi tertentu
  const getDevicesByLocation = (location: string) => {
    const indices = data.Location.map((loc, i) =>
      loc === location ? i : -1
    ).filter((i) => i !== -1);
    return indices.map((i) => ({
      "Device Name": data["Device Name"][i],
      Location: data.Location[i],
      "Energy Consumption (kWh)": energyConsumption[i],
      "Duration (Hours)": durationHours[i],
    }));
  };

  //   Rata-rata konsumsi energi per jenis perangkat
  const averageEnergyByType = () => {
    const typeMap: { [key: string]: { total: number; count: number } } = {};
    data["Device Type"].forEach((type, i) => {
      if (!typeMap[type]) typeMap[type] = { total: 0, count: 0 };
      typeMap[type].total += energyConsumption[i];
      typeMap[type].count += 1;
    });
    const averages: { [key: string]: number } = {};
    for (const [type, { total, count }] of Object.entries(typeMap)) {
      averages[type] = total / count;
    }
    return averages;
  };

  return {
    totalEnergyConsumption,
    averageEnergyConsumption,
    connectedDevicesCount,
    maxEnergyDevice,
    maxDurationDevice,
    getDevicesByLocation,
    averageEnergyByType: averageEnergyByType(),
  };
}

type ChartData = {
  category: string;
  value: number;
  fill: string;
};

type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

export function transformDataToChartProps(data: Appliance[]): {
  chartData: ChartData[];
  chartConfig: ChartConfig;
} {
  // Generate warna untuk setiap perangkat berdasarkan panjang array
  const colors = generateColors(data.length);

  // Mengubah data ke dalam format chartData
  const chartData: ChartData[] = data.map((item, index) => ({
    category: item.name, // Misalnya: Mesin Cuci, Microwave
    value: parseFloat(item.average_usage.toFixed(1)), // Membatasi 1 angka di belakang koma
    fill: colors[index], // Warna berdasarkan index
  }));

  // Membuat chartConfig
  const chartConfig: ChartConfig = data.reduce((acc, item, index) => {
    acc[item.type] = {
      label: item.name, // Nama perangkat
      color: colors[index], // Warna perangkat
    };
    return acc;
  }, {} as ChartConfig);

  return { chartData, chartConfig };
}

// Fungsi untuk menghasilkan warna cerah dan kontras tinggi
export function generateColors(length: number): string[] {
  const colors: string[] = [];
  const step = 360 / length; // Membagi warna secara merata dalam spektrum HSL

  for (let i = 0; i < length; i++) {
    const hue = Math.round(i * step); // Menentukan hue (warna utama)
    const saturation = 70 + Math.round((i % 3) * 10); // Saturasi: 70% hingga 90%
    const lightness = 50; // Kecerahan tetap di 50% untuk warna cerah
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  return colors;
}

export function findOverusedDevices(
  allAppliances: AllAppliances,
  appliances: Appliance[]
): OverusedDevices[] {
  // Hasil perangkat yang melebihi average_usage
  const overusedDevices: OverusedDevices[] = [];

  // Loop melalui semua perangkat di AllAppliances
  allAppliances["Device Name"].forEach((deviceName, index) => {
    const deviceDurationStr = allAppliances["Duration (Hours)"][index];
    const deviceDuration = parseFloat(deviceDurationStr) || 0; // Konversi ke angka
    const matchedAppliance = appliances.find((a) => a.name === deviceName); // Cocokkan dengan Appliance

    if (matchedAppliance && deviceDuration > matchedAppliance.average_usage) {
      overusedDevices.push({
        name: deviceName,
        duration: deviceDuration,
        averageUsage: matchedAppliance.average_usage,
        usageStartTime: allAppliances["Usage Start Time"][index],
        usageEndTime: allAppliances["Usage End Time"][index],
      });
    }
  });

  return overusedDevices;
}

export function mapStringsToObjects(data: string[]) {
  return data.map((item) => {
    const nameMatch = item.match(/Name: ([^,]+)/);
    const typeMatch = item.match(/Type: ([^,]+)/);
    const priorityMatch = item.match(/Priority: (true|false)/);
    const monthlyUseMatch = item.match(/Monthly Use: ([\d.]+) kWh/);
    const costMatch = item.match(/Cost: Rp([\d.]+)/);
    const scheduleMatch = item.match(/Schedule: \[([^\]]*)\]/);

    return {
      name: nameMatch ? nameMatch[1] : null,
      type: typeMatch ? typeMatch[1] : null,
      priority: priorityMatch ? priorityMatch[1] === "true" : null,
      monthlyUse: monthlyUseMatch ? parseFloat(monthlyUseMatch[1]) : null,
      cost: costMatch ? parseFloat(costMatch[1]) : null,
      ctaText: "Detail",
      schedule: scheduleMatch
        ? scheduleMatch[1]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };
  });
}

export function getTariffCost(golongan: string): number {
  switch (golongan) {
    case "Subsidi daya 450 VA":
      return 415.0;
    case "Subsidi daya 900 VA":
      return 605.0;
    case "R-1/TR daya 900 VA":
      return 1352.0;
    case "R-1/TR daya 1300 VA":
      return 1444.7;
    case "R-1/TR daya 2200 VA":
      return 1444.7;
    case "R-2/TR daya 3500 VA - 5500 VA":
      return 1699.53;
    case "R-3/TR daya 6600 VA ke atas":
      return 1699.53;
    case "B-2/TR daya 6600 VA - 200 kVA":
      return 1444.7;
    case "B-3/TM daya di atas 200 kVA":
      return 1114.74;
    case "I-3/TM daya di atas 200 kVA":
      return 1114.74;
    case "I-4/TT daya 30.000 kVA ke atas":
      return 996.74;
    case "P-1/TR daya 6600 VA - 200 kVA":
      return 1699.53;
    case "P-2/TM daya di atas 200 kVA":
      return 1522.88;
    case "P-3/TR penerangan jalan umum":
      return 1699.53;
    case "L/TR":
      return 1644.0;
    case "L/TM":
      return 1644.0;
    case "L/TT":
      return 1644.0;
    default:
      return -1;
  }
}

export function convertApplianceStringToObject(input: string) {
  const regex =
    /Name: (.+?), Type: (.+?), Priority: (true|false), Monthly Use: (.+?) kWh, Cost: Rp(.+?), Schedule: \[(.+)\]/;

  const match = input.match(regex);

  if (!match) {
    throw new Error("String tidak sesuai format yang diharapkan.");
  }

  const [_, name, type, priority, monthlyUse, cost, schedule] = match;

  return {
    name: name.trim(),
    type: type.trim(),
    priority: priority === "true",
    monthlyUse: parseFloat(monthlyUse),
    cost: parseFloat(cost),
    schedule: schedule.split(" ").map((slot) => slot.trim()),
  };
}

interface ApplianceJSON {
  name: string;
  type: string;
  priority: boolean;
  monthlyUse: number;
  cost: number;
  schedule: string[];
}

interface SummaryJSON {
  total_energy: number;
  total_cost: string;
  message: string;
}

interface DataJSON {
  summary: SummaryJSON;
  appliances: ApplianceJSON[];
}

export function exportToPDF(data: DataJSON, fileName: string = "Report") {
  const doc = new jsPDF();

  // Menambahkan logo (jika ada)
  const logoURL = "/logo.webp"; // Ganti dengan path logo Anda
  doc.addImage(logoURL, "PNG", 10, 12, 10, 10);

  // Menambahkan judul laporan
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185); // Warna biru untuk judul
  doc.text("Jadwal Penggunaan Appliances", 105, 20, { align: "center" });

  // Menambahkan garis pemisah
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(1.5);
  doc.line(10, 25, 200, 25); // Garis horizontal

  // Menambahkan ringkasan
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Total Energy: ${data.summary.total_energy
      .toFixed(2)
      .replace(".", ",")} (kWh)`,
    14,
    40
  );
  doc.text(`Total Cost: IDR ${data.summary.total_cost}`, 14, 47);

  // Menyiapkan header tabel dan data tabel
  const tableHeaders = [
    "Name",
    "Type",
    "Priority",
    "Monthly Use (kWh)",
    "Cost (IDR)",
    "Schedule",
  ];
  const tableData = data.appliances.map((appliance) => [
    appliance.name,
    appliance.type,
    appliance.priority ? "High" : "Low",
    appliance.monthlyUse.toFixed(2).replace(".", ","),
    appliance.cost.toFixed(2).replace(".", ","),
    appliance.schedule.join(", "),
  ]);

  // Menambahkan tabel dengan styling
  autoTable(doc, {
    startY: 55, // Posisi awal tabel
    head: [tableHeaders], // Header tabel
    body: tableData, // Isi tabel
    theme: "grid", // Tema tabel
    headStyles: {
      fillColor: [41, 128, 185], // Warna header (biru)
      textColor: 255, // Warna teks header (putih)
      fontSize: 12,
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: [0, 0, 0], // Warna teks body (hitam)
      fontSize: 11,
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240], // Warna abu-abu untuk baris selang-seling
    },
    margin: { top: 10, bottom: 20 },
  });

  // Tambahkan footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Generated on: ${new Date().toLocaleDateString()}`,
    14,
    pageHeight - 10
  );

  // Menyimpan file PDF
  doc.save(`${fileName}.pdf`);
}
