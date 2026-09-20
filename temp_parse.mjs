import fs from 'fs';
import * as xlsx from 'xlsx';

const path = process.argv[2];
const buf = fs.readFileSync(path);
const wb = xlsx.read(buf, { type: 'buffer' });
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
console.log(JSON.stringify(data, null, 2));
