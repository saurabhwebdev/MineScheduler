const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create template data with one dummy entry
const templateData = [
  {
    delayCategory: 'Equipment',
    delayCode: 'EQ001',
    description: 'Equipment breakdown or maintenance delay',
    isActive: 'Active'
  }
];

// Create worksheet
const ws = XLSX.utils.json_to_sheet(templateData);

// Set column widths
ws['!cols'] = [
  { wch: 20 },  // delayCategory
  { wch: 15 },  // delayCode
  { wch: 50 },  // description
  { wch: 12 }   // isActive
];

// Create workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Delays');

// Write file to public folder
const outputPath = path.join(__dirname, 'public', 'Delay_Import_Template.xlsx');

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

XLSX.writeFile(wb, outputPath);

console.log(`✅ Template created successfully at: ${outputPath}`);
console.log('📊 Template contains 1 dummy delay entry');
console.log('📋 Columns: delayCategory, delayCode, description, isActive');
