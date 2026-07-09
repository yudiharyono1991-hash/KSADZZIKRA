import { Transaction } from '../types';

export class EscPosEncoder {
  private buffer: number[] = [];

  initialize() {
    this.buffer.push(0x1B, 0x40);
    return this;
  }

  alignCenter() {
    this.buffer.push(0x1B, 0x61, 0x01);
    return this;
  }

  alignLeft() {
    this.buffer.push(0x1B, 0x61, 0x00);
    return this;
  }

  alignRight() {
    this.buffer.push(0x1B, 0x61, 0x02);
    return this;
  }

  bold(on: boolean) {
    this.buffer.push(0x1B, 0x45, on ? 1 : 0);
    return this;
  }

  text(str: string) {
    for (let i = 0; i < str.length; i++) {
      this.buffer.push(str.charCodeAt(i));
    }
    return this;
  }

  newline() {
    this.buffer.push(0x0A);
    return this;
  }

  line(str: string) {
    this.text(str);
    this.newline();
    return this;
  }

  cut() {
    // Partial cut command
    this.buffer.push(0x1D, 0x56, 0x42, 0x00);
    return this;
  }

  openCashDrawer() {
    // Standard ESC/POS kick drawer command: ESC p m t1 t2
    this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA);
    return this;
  }

  encode() {
    return new Uint8Array(this.buffer);
  }
}

// Format number properly
const formatMoney = (amount: number) => {
  return amount.toLocaleString('id-ID');
};

export const generateReceiptEscPos = (tx: Transaction, storeName = "Toko KSA Mart", storeAddress = "KANTOR PUSAT, INDONESIA", storePhone = "Telp: 082210027952", zakatTitle = "MISI BERKAH BERAMAL", zakatDesc = "Zakat Kontribusi Sebesar Rp {amount} dari transaksi ini\ndicadangkan untuk kaum Dhuafa.") => {
  const encoder = new EscPosEncoder();
  const maxLineLen = 32; // Default 58mm printer

  encoder.initialize();
  encoder.openCashDrawer(); // Kick drawer before printing
  encoder.alignCenter().bold(true).line(storeName);
  encoder.bold(false).line(storeAddress);
  if (storePhone) {
    encoder.line(storePhone);
  }
  encoder.line("--------------------------------");
  encoder.alignLeft();
  
  // Format Date
  const dateObj = new Date(tx.timestamp);
  const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  encoder.line(`No Invoice: ${tx.invoiceNo}`);
  encoder.line(`Waktu: ${dateStr}, ${timeStr}`);
  // Do not truncate cashier name so it wraps automatically if too long
  encoder.line(`Kasir: ${tx.cashierName}`);
  encoder.line(`Pelanggan: ${tx.customerName || 'Umum'}`);
  encoder.line(`Metode: ${tx.paymentMethod}`);
  encoder.line("--------------------------------");

  // Items
  tx.items.forEach(item => {
    // Product Name (truncated to 32 chars)
    let name = item.productName;
    if (item.targetNumber) {
      name += ` [No: ${item.targetNumber}]`;
    }
    encoder.line(name.substring(0, maxLineLen));
    
    // Qty x Price          Total
    const qtyPriceStr = `${item.quantity} x Rp ${formatMoney(item.price)}`;
    const totalStr = `Rp ${formatMoney(item.quantity * item.price)}`;
    
    let spacesCount = maxLineLen - qtyPriceStr.length - totalStr.length;
    if (spacesCount < 1) spacesCount = 1;
    
    encoder.line(qtyPriceStr + " ".repeat(spacesCount) + totalStr);
  });

  encoder.line("--------------------------------");
  
  // Totals
  const printRightAligned = (label: string, valueStr: string) => {
    let spaces = maxLineLen - label.length - valueStr.length;
    if (spaces < 1) spaces = 1;
    encoder.line(label + " ".repeat(spaces) + valueStr);
  };

  if (tx.discountAmount > 0) {
    printRightAligned("Diskon Promo:", `- Rp ${formatMoney(tx.discountAmount)}`);
  }
  if (tx.pointsDiscount > 0) {
    printRightAligned(`Tukar Poin (${tx.pointsRedeemed}):`, `- Rp ${formatMoney(tx.pointsDiscount)}`);
  }
  if (tx.pointsEarned > 0) {
    printRightAligned("Poin Didapat:", `+ ${tx.pointsEarned} Poin`);
  }
  if (tx.taxAmount > 0) {
    printRightAligned("Pajak (PPN):", `Rp ${formatMoney(tx.taxAmount)}`);
  }
  
  encoder.line("--------------------------------");
  printRightAligned("Total Belanja:", `Rp ${formatMoney(tx.totalAmount)}`);

  if (tx.splitPayments && tx.splitPayments.length > 0) {
    tx.splitPayments.forEach((sp: any) => {
      printRightAligned(`Bayar ${sp.method}:`, `Rp ${formatMoney(sp.amount)}`);
    });
  } else {
    printRightAligned("Uang Diterima:", `Rp ${formatMoney(tx.amountPaid)}`);
  }
  
  printRightAligned("Uang Kembali:", `Rp ${formatMoney(tx.changeAmount)}`);
  
  if (tx.pointsEarned > 0) {
    printRightAligned("Poin Diperoleh:", `+ ${tx.pointsEarned} Poin`);
  }

  encoder.line("--------------------------------");
  
  // Zakat / Charity
  if (tx.zakatContribution > 0) {
    encoder.alignCenter().bold(true);
    encoder.line(zakatTitle);
    encoder.bold(false);
    
    // Replace {amount} with actual formatted amount, then split by newlines
    const formattedDesc = zakatDesc.replace('{amount}', `Rp ${formatMoney(tx.zakatContribution)}`);
    const descLines = formattedDesc.split('\n');
    descLines.forEach((line) => {
      // Split into max 32 chars per line if it's too long, though hardware buffer often auto-wraps
      encoder.line(line);
    });
    
    encoder.line("--------------------------------");
  }

  encoder.newline();
  encoder.alignCenter();
  encoder.line("Terima Kasih");
  encoder.line("Barang Halal Berkah Bermanfaat");
  
  // Feed lines before cut
  encoder.newline().newline().newline();
  encoder.cut();
  
  return encoder.encode();
};

export const printToBluetooth = async (tx: Transaction, storeName?: string, storeAddress?: string, storePhone?: string, zakatTitle?: string, zakatDesc?: string) => {
  try {
    const nav: any = navigator;
    if (!nav.bluetooth) {
      throw new Error("Browser ini tidak mendukung Web Bluetooth (Gunakan Google Chrome/Edge di PC atau Android).");
    }

    let device;
    try {
      device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Generic printer
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '0000fee7-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '0000ff00-0000-1000-8000-00805f9b34fb', // Additional common printer UUIDs
          '0000ae00-0000-1000-8000-00805f9b34fb',
          '0000ae30-0000-1000-8000-00805f9b34fb'
        ]
      });
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error("Pencarian dibatalkan atau tidak ada printer Bluetooth yang ditemukan.");
      }
      throw err;
    }

    if (!device) throw new Error("Gagal memilih printer.");

    let server = await device.gatt?.connect();
    if (!server) throw new Error("Gagal terkoneksi ke GATT server printer.");

    // Tambahkan jeda waktu agar koneksi GATT stabil (sering terjadi di printer RPP02N dkk)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Jika tiba-tiba disconnect, coba reconnect sekali lagi
    if (!device.gatt?.connected) {
       console.log("GATT terputus, mencoba reconnect...");
       server = await device.gatt?.connect();
       await new Promise(resolve => setTimeout(resolve, 1500));
       if (!device.gatt?.connected) {
          throw new Error("GATT Server is disconnected. Printer menolak koneksi. Coba unpair dari Windows lalu coba lagi.");
       }
    }

    // Find valid printing service
    const services = await server.getPrimaryServices();
    let printCharacteristic: any = null;
    
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          printCharacteristic = char;
          break; // Found writable characteristic
        }
      }
      if (printCharacteristic) break;
    }

    if (!printCharacteristic) {
      throw new Error("Tidak menemukan akses (characteristic) yang bisa ditulisi pada printer ini.");
    }

    // Generate ESC/POS Bytes
    const data = generateReceiptEscPos(tx, storeName, storeAddress, storePhone, zakatTitle, zakatDesc);
    
    // Send in chunks (BLE has limit per packet, usually 512 bytes or 20 bytes depending on MTU)
    // Printer murah seperti RPP02N memiliki buffer sangat kecil. Jika dikirim terlalu cepat,
    // struk akan terpotong (hanya sebagian yang tercetak).
    const chunkSize = 50; // Kurangi ukuran chunk agar aman
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await printCharacteristic.writeValue(chunk);
      // Jeda 50ms antar potongan agar buffer printer hardware punya waktu mencetak
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Disconnect to save battery
    device.gatt?.disconnect();
    return true;

  } catch (error: any) {
    console.error('Bluetooth printing error:', error);
    throw error;
  }
};

export const openCashDrawerBluetooth = async () => {
  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
      optionalServices: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2']
    });

    const server = await device.gatt.connect();
    
    // Try standard printer service UUIDs
    let service;
    try {
      service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    } catch (e) {
      service = await server.getPrimaryService('e7810a71-73ae-499d-8c15-faa9aef0c3f2');
    }

    // Try standard characteristic UUIDs
    let characteristic;
    try {
      characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
    } catch (e) {
      characteristic = await service.getCharacteristic('bef8d6c9-9c21-4c9e-b632-bd58c1009f9f');
    }

    const encoder = new EscPosEncoder();
    encoder.initialize().openCashDrawer();
    const data = encoder.encode();

    // Send in chunks (BLE usually has 20-512 byte limit per write)
    const CHUNK_SIZE = 100;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
    }

    await device.gatt.disconnect();
  } catch (error) {
    console.error('Bluetooth drawer error:', error);
    throw error;
  }
};
