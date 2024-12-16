const arr = [2, 34, 5, 6];

const area = function (radius) {
  return Math.PI * radius * radius;
};

const calculateA = (radius,logic) => {
  const op = [];
  for (let i = 0; i < arr.length; i++) {
    op.push(logic(radius[i]));
  }
  return op;
}

console.log(calculateA(arr,area));









function abc(factor){

  return function xyz (no){

      return factor*no;
  }
}

const a = abc(5);
console.log(a(2))
















/**-------------------------- */


const calculateArea = () => {
  const op = [];
  for (let i = 0; i < arr.length; i++) {
    op.push(Math.PI * arr[i] * arr[i]);
  }

  return op;
};

const calculateCirumference = () => {
  const op = [];
  for (let i = 0; i < arr.length; i++) {
    op.push(2 * Math.PI * arr[i]);
  }

  return op;
};

//console.log(calculateArea(), calculateCirumference());
