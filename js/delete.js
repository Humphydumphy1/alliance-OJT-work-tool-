    function generateDeleteSQL() {
      const raw = document.getElementById("deleteRecnos").value.trim();
      const outputBox = document.getElementById("deleteOutput");

      if (!raw) {
        alert("Please enter FRECNO values to keep.");
        return;
      }

      const values = raw
        .split(/\r?\n/)
        .map(val => val.trim())
        .filter(val => val)
        .map(val => `'${val}'`);

      const grouped = [];
      for (let i = 0; i < values.length; i += 8) {
        grouped.push(values.slice(i, i + 8).join(", "));
      }

      const formatted = grouped.join(",\n    ");

      const sql =
`DELETE FROM pos_sale 
WHERE frecno NOT IN (
    ${formatted}
);

DELETE FROM pos_sale_payment 
WHERE frecno NOT IN (
    ${formatted}
);

DELETE FROM pos_sale_product 
WHERE frecno NOT IN (
    ${formatted}
);`;

      outputBox.textContent = sql;
      outputBox.style.display = "block";
    }

    function clearDeleteForm() {
      document.getElementById("deleteRecnos").value = '';
      const outputBox = document.getElementById("deleteOutput");
      outputBox.textContent = '/* Output will appear here after generation */';
      outputBox.style.display = 'none';
    }

    function copyToClipboard() {
      const output = document.getElementById("deleteOutput").textContent;
      if (!output || output.includes("Output will appear")) {
        alert("Nothing to copy. Please generate the SQL first.");
        return;
      }
      navigator.clipboard.writeText(output).then(() => {
        alert("SQL script copied to clipboard!");
      });
    }

    function toggleOutput() {
      const output = document.getElementById("deleteOutput");
      const toggleBtn = document.querySelector("button.toggle");
      const isVisible = output.style.display === "block";
      output.style.display = isVisible ? "none" : "block";
      toggleBtn.setAttribute("aria-pressed", !isVisible);
    }