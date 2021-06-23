import * as THREE from 'three'

const generateRandomColors = () => {
  let colors = []
  let letters = '0123456789ABCDEF'

  let hexR = '#'
  for (let i = 0; i < 6; i++) {
    hexR += letters[Math.floor(Math.random() * 16)]
  }
  let hexG = '#'
  for (let i = 0; i < 6; i++) {
    hexG += letters[Math.floor(Math.random() * 16)]
  }
  let hexB = '#'
  for (let i = 0; i < 6; i++) {
    hexB += letters[Math.floor(Math.random() * 16)]
  }

  const color = new THREE.Color()
  color.setRGB(hexR, hexG, hexB)
  color.set(hexB)
  colors.push(color.r, color.g, color.b)
  return colors
}
export { generateRandomColors }
