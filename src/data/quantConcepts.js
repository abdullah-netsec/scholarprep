export const quantConcepts = [
  {
    id: "arithmetic",
    title: "Arithmetic & Number Properties",
    icon: "Calculator",
    topics: [
      {
        name: "Prime Numbers & Divisibility",
        content: "A prime number is an integer greater than 1 that has only two factors: 1 and itself. GAT often tests prime numbers under 100 (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97).\n\n**Divisibility Rules:**\n- **Divisibility by 3:** Sum of digits is divisible by 3.\n- **Divisibility by 4:** Last two digits form a number divisible by 4.\n- **Divisibility by 6:** Divisible by both 2 and 3.\n- **Divisibility by 9:** Sum of digits is divisible by 9.",
        example: "Is 4,581 divisible by 9?\n**Solution:** Sum the digits: 4 + 5 + 8 + 1 = 18. Since 18 is divisible by 9, the number 4,581 is divisible by 9."
      },
      {
        name: "Percentages & Ratios",
        content: "Percentage increase or decrease is calculated as:\n$$\\text{Percent Change} = \\frac{|\\text{New Value} - \\text{Old Value}|}{\\text{Old Value}} \\times 100\\%$$\n\n**Ratios:** If a ratio of items is $a:b$, then the total parts are $a+b$. The value of one part is $\\text{Total} / (a+b)$.",
        example: "A laptop price drops from $800 to $600. What is the percentage decrease?\n**Solution:** $\\text{Change} = 800 - 600 = 200$. $\\text{Percent Decrease} = (200 / 800) \\times 100\\% = 25\\%.$"
      },
      {
        name: "Exponent Rules & Scientific Notation",
        content: "Know the core laws of exponents:\n- $x^a \\cdot x^b = x^{a+b}$\n- $x^a / x^b = x^{a-b}$\n- $(x^a)^b = x^{ab}$\n- $x^{-a} = 1 / x^a$\n- $x^0 = 1$ (for $x \\neq 0$)",
        example: "Simplify $(2^3)^2 \\cdot 2^{-4}$.\n**Solution:** $(2^3)^2 = 2^6$. Then $2^6 \\cdot 2^{-4} = 2^{6 + (-4)} = 2^2 = 4.$"
      }
    ]
  },
  {
    id: "algebra",
    title: "Algebraic Reasoning",
    icon: "Variable",
    topics: [
      {
        name: "Linear Equations & Inequalities",
        content: "Solve for the variable by applying the same operation to both sides of the equation. Remember: **When multiplying or dividing an inequality by a negative number, flip the inequality sign.**",
        example: "Solve $5 - 3x \\le 14$.\n**Solution:** Subtract 5: $-3x \\le 9$. Divide by -3 (and flip sign): $x \\ge -3$."
      },
      {
        name: "Quadratic Equations & Factoring",
        content: "GAT frequently tests three classic algebraic identities:\n1. $(a + b)^2 = a^2 + 2ab + b^2$\n2. $(a - b)^2 = a^2 - 2ab + b^2$\n3. $a^2 - b^2 = (a - b)(a + b)$ (Difference of Squares)",
        example: "If $x^2 - y^2 = 24$ and $x - y = 4$, what is $x + y$?\n**Solution:** Since $x^2 - y^2 = (x - y)(x + y)$, we substitute: $24 = 4 \\cdot (x + y)$. Dividing by 4, we get $x + y = 6$."
      },
      {
        name: "Sequences & Patterns",
        content: "- **Arithmetic Sequence:** $a_n = a_1 + (n-1)d$, where $d$ is the common difference.\n- **Geometric Sequence:** $a_n = a_1 \\cdot r^{n-1}$, where $r$ is the common ratio.",
        example: "Find the 10th term in the sequence: 3, 7, 11, 15, ...\n**Solution:** This is an arithmetic sequence with $a_1 = 3$ and $d = 4$. $a_{10} = 3 + (10 - 1) \\cdot 4 = 3 + 36 = 39.$"
      }
    ]
  },
  {
    id: "geometry",
    title: "Plane & Coordinate Geometry",
    icon: "Compass",
    topics: [
      {
        name: "Angles & Lines",
        content: "- **Vertical angles** are equal.\n- **Supplementary angles** add up to $180^\\circ$.\n- **Parallel lines cut by a transversal:** Alternate interior, alternate exterior, and corresponding angles are equal.",
        example: "If two parallel lines are crossed by a transversal, and one interior angle is $70^\\circ$, what is the measure of its consecutive interior angle?\n**Solution:** Consecutive interior angles are supplementary, so the angle is $180^\\circ - 70^\\circ = 110^\\circ$."
      },
      {
        name: "Triangles & Pythagorean Theorem",
        content: "- **Angle Sum:** Sum of interior angles is always $180^\\circ$.\n- **Area:** $\\text{Area} = \\frac{1}{2} \\times \\text{base} \\times \\text{height}$.\n- **Pythagorean Theorem:** In a right triangle, $a^2 + b^2 = c^2$. Common Pythagorean triples to memorize: (3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25).\n- **Special Triangles:** $45^\\circ-45^\\circ-90^\\circ$ (sides $x, x, x\\sqrt{2}$) and $30^\\circ-60^\\circ-90^\\circ$ (sides $x, x\\sqrt{3}, 2x$)."
      },
      {
        name: "Circles & Polygons",
        content: "- **Circle Area:** $A = \\pi r^2$\n- **Circle Circumference:** $C = 2\\pi r$\n- **Polygon Angles:** Sum of interior angles of an $n$-sided polygon is $(n-2) \\times 180^\\circ$. For example, a pentagon has $(5-2) \\times 180 = 540^\\circ$.",
        example: "What is the area of a circle with circumference $10\\pi$?\n**Solution:** $C = 2\\pi r = 10\\pi \\implies r = 5$. Area $A = \\pi (5)^2 = 25\\pi$."
      }
    ]
  },
  {
    id: "data-analysis",
    title: "Data Interpretation & Statistics",
    icon: "BarChart3",
    topics: [
      {
        name: "Mean, Median, Mode & Range",
        content: "- **Mean (Average):** $\\text{Sum of values} / \\text{Number of values}$\n- **Median:** Middle value when ordered. If even count, average of the two middle values.\n- **Mode:** Most frequent value.\n- **Range:** Maximum value minus minimum value.",
        example: "Find the mean and median of: 4, 8, 3, 9, 6.\n**Solution:** Order values: 3, 4, 6, 8, 9. Median = 6. Mean = $(3+4+6+8+9)/5 = 30/5 = 6.$"
      },
      {
        name: "Probability",
        content: "$$\\text{Probability of Event} = \\frac{\\text{Number of Favorable Outcomes}}{\\text{Total Number of Possible Outcomes}}$$\nIndependent events: $P(A \\text{ and } B) = P(A) \\times P(B)$.",
        example: "A bag contains 3 red balls and 5 blue balls. What is the probability of picking a red ball?\n**Solution:** Favorable = 3, Total = 8. Probability = $3/8$."
      }
    ]
  }
];
