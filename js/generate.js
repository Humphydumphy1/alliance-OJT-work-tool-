    function generateFrecnos() {
      const start = parseInt(document.getElementById("startFrecno").value);
      const oldText = document.getElementById("oldFrecnos").value.trim();
      const output = document.getElementById("generateOutput");

      if (isNaN(start) || !oldText) {
        alert("Please enter the latest FRECNO and paste old FRECNO values.");
        return;
      }

      const oldLines = oldText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (oldLines.length === 0) {
        alert("Please paste at least one old FRECNO.");
        return;
      }

      const tables = ['pos_sale', 'pos_sale_payment', 'pos_sale_product'];
      let currentNew = start;

      // Map old FRECNO to new incremented FRECNO
      const mappings = oldLines.map(oldVal => ({
        oldVal,
        newVal: currentNew++
      }));

      // Build SQL update statements string in CASE WHEN format with double quotes around values
      let sql = '';
      tables.forEach(table => {
        sql += `UPDATE ${table} \nSET frecno = \n  CASE frecno\n`;
        mappings.forEach(({ oldVal, newVal }) => {
          sql += `    WHEN "${oldVal}" THEN "${newVal}"\n`;
        });
        sql += `\n    ELSE frecno\n  END;\n\n`;
      });

      output.textContent = sql.trim();
      output.style.display = 'block';
      output.scrollTop = 0;
    }

    function clearForm() {
      document.getElementById("startFrecno").value = "";
      document.getElementById("oldFrecnos").value = "";
      const output = document.getElementById("generateOutput");
      output.textContent = "";
      output.style.display = 'none';
    }

    function copyGeneratedFrecnos() {
      const output = document.getElementById("generateOutput");
      if (!output.textContent.trim()) {
        alert("Nothing to copy. Please generate FRECNOs first.");
        return;
      }
      navigator.clipboard.writeText(output.textContent).then(() => {
        alert("Copied to clipboard!");
      }).catch(() => {
        alert("Failed to copy. Try manually.");
      });
    }

    function toggleGeneratedOutput() {
      const output = document.getElementById("generateOutput");
      const btn = event.currentTarget;
      if (output.style.display === 'block') {
        output.style.display = 'none';
        btn.setAttribute('aria-pressed', 'false');
      } else {
        output.style.display = 'block';
        btn.setAttribute('aria-pressed', 'true');
        output.scrollTop = 0;
      }
    }