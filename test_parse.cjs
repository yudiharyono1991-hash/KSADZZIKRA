const LZString = require('lz-string');

const parseStorageData1 = (dataStr) => {
  if (!dataStr) return null;
  try {
    if (dataStr.startsWith('[') || dataStr.startsWith('{') || dataStr === 'null' || dataStr === 'true' || dataStr === 'false' || !Number.isNaN(Number(dataStr))) {
      return JSON.parse(dataStr);
    }
    const decompressed = LZString.decompressFromUTF16(dataStr);
    if (decompressed) {
      return JSON.parse(decompressed);
    }
    return JSON.parse(dataStr);
  } catch (e) {
    return null;
  }
};

const parseStorageData2 = (dataStr) => {
  if (!dataStr) return null;
  try {
    return JSON.parse(dataStr);
  } catch (e) {
    try {
      const decompressed = LZString.decompressFromUTF16(dataStr);
      if (decompressed) {
        return JSON.parse(decompressed);
      }
    } catch (e2) {}
  }
  return null;
};

const rawArray = JSON.stringify([{id: 1, name: "test"}]);
const rawString = JSON.stringify("INV-1234");
const compressedArray = LZString.compressToUTF16(rawArray);
const compressedString = LZString.compressToUTF16(rawString);

console.log("parse1 rawArray:", parseStorageData1(rawArray)); // Should work
console.log("parse1 rawString:", parseStorageData1(rawString)); // Will fail (return null)
console.log("parse1 compressedArray:", parseStorageData1(compressedArray)); // Should work
console.log("parse1 compressedString:", parseStorageData1(compressedString)); // Should work

console.log("parse2 rawArray:", parseStorageData2(rawArray)); // Should work
console.log("parse2 rawString:", parseStorageData2(rawString)); // Should work
console.log("parse2 compressedArray:", parseStorageData2(compressedArray)); // Should work
console.log("parse2 compressedString:", parseStorageData2(compressedString)); // Should work
