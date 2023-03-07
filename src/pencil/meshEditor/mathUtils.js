export class mathUtils {
  constructor() {}

  // Rounds the number to a nearest value changed by step
  static roundToStep(number, step) {
    let a = parseInt(number / step, 10) * step;

    let b = a + step;

    // Return of closest of two
    return number - a > b - number ? b : a;
  }

  static round(number, places) {
    return +(Math.round(number + 'e+' + places) + 'e-' + places);
  }
}
