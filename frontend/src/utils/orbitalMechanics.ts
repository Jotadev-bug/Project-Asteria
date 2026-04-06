export const AU_SCALAR = 35.0;

/**
 * Solves Kepler's Equation M = E - e * sin(E) for E using Newton-Raphson.
 */
export function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 10; i++) {
    const delta = E - e * Math.sin(E) - M;
    if (Math.abs(delta) < 1e-6) break;
    E -= delta / (1 - e * Math.cos(E));
  }
  return E;
}

/**
 * Converts Keplerian elements to 3D Cartesian Ecliptic coordinates [x, y, z].
 * Angles must be in RADIANS!
 * @returns [x, y, z] in Three.js coordinate space
 */
export function getCartesianPosition(
  a: number,
  e: number,
  i: number,
  om: number,
  w: number,
  M: number
): [number, number, number] {
  // 1. Solve Kepler's equation
  const E = solveKepler(M, e);

  // 2. Calculate coordinates in the orbital plane
  // True anomaly `v` and distance `r` combined into x' and y'
  const x_prime = a * (Math.cos(E) - e);
  const y_prime = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // 3. Rotate to Ecliptic plane
  // Standard transformation matrix from orbital plane to ecliptic frame
  const X =
    (Math.cos(om) * Math.cos(w) - Math.sin(om) * Math.sin(w) * Math.cos(i)) * x_prime +
    (-Math.cos(om) * Math.sin(w) - Math.sin(om) * Math.cos(w) * Math.cos(i)) * y_prime;
    
  const Y =
    (Math.sin(om) * Math.cos(w) + Math.cos(om) * Math.sin(w) * Math.cos(i)) * x_prime +
    (-Math.sin(om) * Math.sin(w) + Math.cos(om) * Math.cos(w) * Math.cos(i)) * y_prime;
    
  const Z =
    (Math.sin(w) * Math.sin(i)) * x_prime +
    (Math.cos(w) * Math.sin(i)) * y_prime;

  // In Three.js:
  // X is right
  // Y is up
  // Z is forward (towards viewer)
  // We want the primary orbital plane (ecliptic) on X-Z.
  // So: Ecliptic X -> Three.js X
  //     Ecliptic Y -> Three.js -Z
  //     Ecliptic Z -> Three.js Y
  return [X * AU_SCALAR, Z * AU_SCALAR, -Y * AU_SCALAR];
}

/**
 * Generates an array of Vector3 points representing the full orbital path.
 */
export function generateOrbitPoints(
  a: number,
  e: number,
  i: number,
  om: number,
  w: number,
  numPoints: number = 100
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const deg2rad = Math.PI / 180;
  
  // Elements expected in degrees, convert to rad
  const iRad = i * deg2rad;
  const omRad = om * deg2rad;
  const wRad = w * deg2rad;
  
  for (let k = 0; k <= numPoints; k++) {
    // Traverse the full Mean Anomaly 0 to 2PI
    const M = (k / numPoints) * Math.PI * 2;
    points.push(getCartesianPosition(a, e, iRad, omRad, wRad, M));
  }
  return points;
}
