const val1 = "25cm";
const val2 = "30cm";
const tol = "5%";

function checkConformity(val1, val2, tolerance) {
  // extract numbers
  const num1 = parseFloat(String(val1).replace(/[^0-9.]/g, ''));
  const num2 = parseFloat(String(val2).replace(/[^0-9.]/g, ''));
  const tolNum = parseFloat(String(tolerance).replace(/[^0-9.]/g, '')) || 0;

  if (!isNaN(num1) && !isNaN(num2)) {
    const diff = Math.abs(num2 - num1);
    const allowedDiff = num1 * (tolNum / 100);
    const isConforme = diff <= allowedDiff;
    const ecart = num2 - num1;
    return { isConforme, ecart, isNumeric: true };
  } else {
    const clean1 = String(val1).toLowerCase().trim();
    const clean2 = String(val2).toLowerCase().trim();
    return { isConforme: clean1 === clean2, ecart: clean1 === clean2 ? '0' : 'Différent', isNumeric: false };
  }
}

console.log(checkConformity(val1, val2, tol));
console.log(checkConformity("25cm", "26cm", "5%"));
console.log(checkConformity("25cm", "26cm", "10%"));
