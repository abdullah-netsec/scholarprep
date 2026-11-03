// Public Demo Sample (Full 660+ Question Bank is gitignored in src/data/quantQuestions.js)
export const quantQuestions = [
  {
    "category": "Geometry",
    "question": "If the perimeter of the triangle is 24 and its sides are x, x + 2, x + 4, find the area of the triangle.",
    "options": [
      "24",
      "33",
      "12",
      "36"
    ],
    "correctAnswer": 0,
    "explanation": "3x + 6 = 24 gives x = 6, so the sides are 6, 8, 10 (a right triangle). Area = ½ × 6 × 8 = 24.",
    "id": "quant_1"
  },
  {
    "category": "Geometry",
    "question": "What is the ratio of the shaded area to the whole equilateral triangle?<br><div class=\"figure-container\" style=\"display:flex; justify-content:center; align-items:center; margin:16px auto; max-width:340px; background:#ffffff; padding:12px; border-radius:8px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 260 220\" role=\"img\" aria-label=\"Equilateral triangle subdivided by midpoints with 1/16 shaded\" width=\"260\" height=\"220\">\n    <polygon points=\"130,20 30,193 230,193\" fill=\"#ffffff\" stroke=\"#1e293b\" stroke-width=\"2.5\"/>\n    <polygon points=\"80,106.5 180,106.5 130,193\" fill=\"none\" stroke=\"#1e293b\" stroke-width=\"2\"/>\n    <!-- Subdivide bottom-left triangle (80,106.5)-(30,193)-(130,193) by its midpoints -->\n    <polygon points=\"55,149.75 105,149.75 80,193\" fill=\"#3b82f6\" fill-opacity=\"0.75\" stroke=\"#1e293b\" stroke-width=\"1.8\"/>\n  </svg></div>",
    "options": [
      "1 : 4",
      "1 : 8",
      "1 : 16",
      "1 : 12"
    ],
    "correctAnswer": 2,
    "explanation": "Joining midpoints splits a triangle into 4 equal parts, so one small triangle is 1/4 of the whole. The shaded triangle is 1/4 of that small triangle, so 1/4 × 1/4 = 1/16.",
    "id": "quant_2"
  },
  {
    "category": "Arithmetic",
    "question": "What is the angle made by the minute hand from 4:00 pm to 7:30 pm?",
    "options": [
      "1000",
      "1080",
      "900",
      "1260 degrees"
    ],
    "correctAnswer": 3,
    "explanation": "From 4:00 to 7:30 is 3.5 hours. The minute hand turns 360° each hour, so 3.5 × 360 = 1260°.",
    "id": "quant_3"
  },
  {
    "category": "Arithmetic",
    "question": "Divide: 885 ÷ 29 =",
    "options": [
      "30<sup>15</sup>&frasl;<sub>29</sub>",
      "30<sup>10</sup>&frasl;<sub>29</sub>",
      "30<sup>12</sup>&frasl;<sub>29</sub>",
      "30<sup>11</sup>&frasl;<sub>29</sub>"
    ],
    "correctAnswer": 0,
    "explanation": "29 × 30 = 870 and 885 − 870 = 15, so the quotient is 30 with remainder 15, i.e. 30<sup>15</sup>&frasl;<sub>29</sub>.",
    "id": "quant_5"
  },
  {
    "category": "Algebra",
    "question": "If 0 &gt; m &gt; h, compare:<br>A) <sup>1</sup>&frasl;<sub>m</sub> &nbsp;&nbsp; B) <sup>1</sup>&frasl;<sub>h</sub>",
    "options": [
      "A",
      "B",
      "Equal",
      "Not enough information"
    ],
    "correctAnswer": 1,
    "explanation": "Both are negative and m &gt; h, so |h| &gt; |m|. Then 1/h is closer to zero than 1/m (e.g. m = −1, h = −2: 1/m = −1, 1/h = −½), so B is greater.",
    "id": "quant_4"
  },
  {
    "category": "Algebra",
    "question": "The sum of two numbers is 25 and the difference between their squares is 125. Find the greatest number.",
    "options": [
      "10",
      "15",
      "20",
      "25"
    ],
    "correctAnswer": 1,
    "explanation": "x<sup>2</sup> − y<sup>2</sup> = (x + y)(x − y) = 125, so x − y = 125 ÷ 25 = 5. With x + y = 25, x = 15 and y = 10.",
    "id": "quant_9"
  },
  {
    "category": "Data Analysis",
    "question": "The graph below shows two curves representing the weight of Yasser and Saad over time. How many times are their weights equal?<br><div class=\"figure-container\" style=\"display:flex; justify-content:center; align-items:center; margin:14px auto; max-width:380px; background:#ffffff; padding:12px; border-radius:8px; border:1px solid #d9d9d9; box-shadow:0 1px 3px rgba(0,0,0,0.06);\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 205\" width=\"350\" height=\"198\" role=\"img\" aria-label=\"Weight curves of Yasser and Saad intersecting at 2 points\">\n  <text x=\"180\" y=\"18\" text-anchor=\"middle\" font-family=\"Calibri, 'Segoe UI', sans-serif\" font-size=\"13\" font-weight=\"700\" fill=\"#1e293b\">Weight of Yasser and Saad Over Time</text>\n  <line x1=\"42\" y1=\"35\" x2=\"335\" y2=\"35\" stroke=\"#e2e8f0\" stroke-width=\"1\"/>\n  <line x1=\"42\" y1=\"68\" x2=\"335\" y2=\"68\" stroke=\"#e2e8f0\" stroke-width=\"1\"/>\n  <line x1=\"42\" y1=\"101\" x2=\"335\" y2=\"101\" stroke=\"#e2e8f0\" stroke-width=\"1\"/>\n  <line x1=\"42\" y1=\"134\" x2=\"335\" y2=\"134\" stroke=\"#e2e8f0\" stroke-width=\"1\"/>\n  <line x1=\"42\" y1=\"165\" x2=\"335\" y2=\"165\" stroke=\"#94a3b8\" stroke-width=\"1.5\"/>\n  <line x1=\"42\" y1=\"30\" x2=\"42\" y2=\"165\" stroke=\"#94a3b8\" stroke-width=\"1.5\"/>\n  <text x=\"18\" y=\"102\" text-anchor=\"middle\" transform=\"rotate(-90 18,102)\" font-family=\"Calibri, 'Segoe UI', sans-serif\" font-size=\"10.5\" font-weight=\"600\" fill=\"#475569\">Weight (kg)</text>\n  <!-- Curve 1: Yasser (#4472c4) -->\n  <path d=\"M 48,45 Q 125,165 195,90 T 325,45\" fill=\"none\" stroke=\"#4472c4\" stroke-width=\"2.8\" stroke-linecap=\"round\"/>\n  <!-- Curve 2: Saad (#ed7d31) -->\n  <path d=\"M 48,148 Q 125,38 195,122 T 325,78\" fill=\"none\" stroke=\"#ed7d31\" stroke-width=\"2.8\" stroke-linecap=\"round\"/>\n  <!-- Legend -->\n  <line x1=\"115\" y1=\"188\" x2=\"135\" y2=\"188\" stroke=\"#4472c4\" stroke-width=\"2.8\"/>\n  <text x=\"140\" y=\"192\" font-family=\"Calibri, 'Segoe UI', sans-serif\" font-size=\"11\" font-weight=\"600\" fill=\"#334155\">Yasser</text>\n  <line x1=\"198\" y1=\"188\" x2=\"218\" y2=\"188\" stroke=\"#ed7d31\" stroke-width=\"2.8\"/>\n  <text x=\"223\" y=\"192\" font-family=\"Calibri, 'Segoe UI', sans-serif\" font-size=\"11\" font-weight=\"600\" fill=\"#334155\">Saad</text>\n</svg></div>",
    "options": [
      "4",
      "2",
      "6",
      "0"
    ],
    "correctAnswer": 1,
    "explanation": "Weights are equal wherever the two curves intersect. The graph shows two crossing points, so 2.",
    "id": "quant_59"
  },
  {
    "category": "Data Analysis",
    "question": "Compare:<br>A) the percent of the shaded region &nbsp;&nbsp; B) 96%<br><div class=\"figure-container\" style=\"display:flex; justify-content:center; align-items:center; margin:16px auto; max-width:320px; background:#ffffff; padding:12px; border-radius:8px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 260 260\" role=\"img\" aria-label=\"5x5 grid of 25 squares, 24 shaded dark green, bottom right square white\" width=\"240\" height=\"240\">\n  <g>\n<rect x=\"20\" y=\"20\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"64\" y=\"20\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"108\" y=\"20\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"152\" y=\"20\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"196\" y=\"20\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"20\" y=\"64\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"64\" y=\"64\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"108\" y=\"64\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"152\" y=\"64\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"196\" y=\"64\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"20\" y=\"108\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"64\" y=\"108\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"108\" y=\"108\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"152\" y=\"108\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"196\" y=\"108\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"20\" y=\"152\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"64\" y=\"152\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"108\" y=\"152\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"152\" y=\"152\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"196\" y=\"152\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"20\" y=\"196\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"64\" y=\"196\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"108\" y=\"196\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"152\" y=\"196\" width=\"44\" height=\"44\" fill=\"#4c7a4c\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n<rect x=\"196\" y=\"196\" width=\"44\" height=\"44\" fill=\"#ffffff\" stroke=\"#1a1a2e\" stroke-width=\"1\"/>\n  </g>\n</svg></div>",
    "options": [
      "A",
      "B",
      "Equal",
      "Not enough information"
    ],
    "correctAnswer": 2,
    "explanation": "With 25 squares and 24 shaded, the shaded percent is 24 ÷ 25 = 96%, which equals B.",
    "id": "quant_71"
  }
];
