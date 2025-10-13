// Generate a random pleasant color for tasks
const generateTaskColor = () => {
  const colors = [
    '#3498db', // Blue
    '#2ecc71', // Green
    '#e74c3c', // Red
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Turquoise
    '#e67e22', // Dark Orange
    '#34495e', // Dark Gray
    '#16a085', // Dark Turquoise
    '#27ae60', // Dark Green
    '#2980b9', // Dark Blue
    '#8e44ad', // Dark Purple
    '#c0392b', // Dark Red
    '#d35400', // Pumpkin
    '#7f8c8d', // Gray
    '#f1c40f', // Yellow
    '#e84393', // Pink
    '#00b894', // Mint
    '#0984e3', // Sky Blue
    '#6c5ce7', // Lavender
    '#fd79a8', // Light Pink
    '#fdcb6e', // Light Orange
    '#55efc4', // Light Turquoise
    '#81ecec', // Cyan
    '#74b9ff', // Light Blue
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

module.exports = { generateTaskColor };
