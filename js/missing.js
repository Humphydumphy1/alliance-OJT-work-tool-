document.addEventListener("DOMContentLoaded", () => {
  let lastMissingArray = [];
  let lastDuplicateArray = [];

  function processFiles() {
    const files = document.getElementById("fileInput").files;
    const output = document.getElementById("output");
    const downloadBtn = document.getElementById("downloadBtn");
    const sqlOutput = document.getElementById("sqlOutput");
    const sqlControls = document.getElementById("sqlControls");

    if (!files.length) {
      alert("Please select at least one file.");
      return;
    }

    output.textContent = "Processing files...\n";
    downloadBtn.style.display = "none";
    sqlOutput.style.display = "none";
    sqlControls.style.display = "none";

    let allMissing = {};
    let allDuplicates = {};
    let processedCount = 0;

    for (let file of files) {
      const reader = new FileReader();

      reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let receiptCol = -1;
        let dateCol = -1;
        let headerRowIndex = -1;

        for (let i = 0; i < json.length; i++) {
          const row = json[i];
          if (!row) continue;

          row.forEach((cell, colIndex) => {
            if (typeof cell === 'string' && cell.toLowerCase().includes("receipt")) {
              receiptCol = colIndex;
              headerRowIndex = i;
            }
            if (typeof cell === 'string' && cell.toLowerCase().includes("date")) {
              dateCol = colIndex;
            }
          });

          if (receiptCol !== -1 && dateCol !== -1) break;
        }

        if (receiptCol === -1 || dateCol === -1) {
          output.textContent += `Could not find 'Receipt#' or 'Date' in ${file.name}\n`;
          processedCount++;
          if (processedCount === files.length) finalizeOutput();
          return;
        }

        const rows = json.slice(headerRowIndex + 1);
        const groupedByDate = {};

        for (let row of rows) {
          const rawReceipt = row[receiptCol];
          const receipt = rawReceipt && typeof rawReceipt === "string" ? rawReceipt.trim() : rawReceipt;
          const date = row[dateCol];

          if (!date || !receipt || isNaN(Number(receipt))) continue;

          if (!groupedByDate[date]) groupedByDate[date] = [];
          groupedByDate[date].push(Number(receipt));
        }

        for (let date in groupedByDate) {
          const receipts = groupedByDate[date].sort((a, b) => a - b);

          let missing = [];

          // Detect missing
          for (let i = 1; i < receipts.length; i++) {
            const prev = receipts[i - 1];
            const curr = receipts[i];
            for (let j = prev + 1; j < curr; j++) {
              missing.push(j);
            }
          }

          // Detect duplicates with a Set to get unique duplicates only
          let seen = new Set();
          let duplicatesSet = new Set();

          for (let r of receipts) {
            if (seen.has(r)) {
              duplicatesSet.add(r);
            } else {
              seen.add(r);
            }
          }

          const duplicates = Array.from(duplicatesSet);

          if (!allMissing[date]) allMissing[date] = [];
          if (!allDuplicates[date]) allDuplicates[date] = [];

          allMissing[date] = allMissing[date].concat(missing);
          allDuplicates[date] = allDuplicates[date].concat(duplicates);
        }

        processedCount++;
        if (processedCount === files.length) finalizeOutput();
      };

      reader.readAsArrayBuffer(file);
    }

    function finalizeOutput() {
      let message = `RECEIPT NUMBER ANALYSIS BY DATE\n\n`;
      let allMissingFlat = [];
      let allDuplicatesFlat = [];

      for (let date in allMissing) {
        const missingList = allMissing[date];
        const duplicateList = allDuplicates[date];

        if (missingList.length || duplicateList.length) {
          message += `${date}:\n`;
          if (missingList.length) {
            message += `  Missing: ${missingList.join(", ")}\n`;
            allMissingFlat.push(...missingList);
          }
          if (duplicateList.length) {
            // Distinct duplicate values, sorted
            const uniqueDuplicates = [...new Set(duplicateList)].sort((a,b) => a-b);
            message += `  Duplicates: ${uniqueDuplicates.map(x => "**" + x + "**").join(", ")}\n`;
            allDuplicatesFlat.push(...uniqueDuplicates);
          }
          message += "\n";
        }
      }

      // Debug logs
      console.log("All missing receipts:", allMissing);
      console.log("All duplicate receipts:", allDuplicates);

      if (allMissingFlat.length === 0 && allDuplicatesFlat.length === 0) {
        message += "No missing or duplicate receipt numbers found.";
        sqlOutput.style.display = "none";
        sqlControls.style.display = "none";
        lastMissingArray = [];
        lastDuplicateArray = [];
      } else {
        // For SQL queries, only missing receipt numbers considered as before
        const uniqueSortedMissing = [...new Set(allMissingFlat)].sort((a, b) => a - b);
        lastMissingArray = uniqueSortedMissing;
        lastDuplicateArray = [...new Set(allDuplicatesFlat)].sort((a,b) => a-b);
        displaySQL("SELECT", lastMissingArray);
        sqlControls.style.display = "flex";
      }

      output.textContent = message;
      downloadBtn.style.display = "inline-block";

      downloadBtn.onclick = function () {
        const blob = new Blob([message], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "missing_and_duplicate_ORs_by_date.txt";
        link.click();
      };
    }
  }

  function generateSQL(type) {
    if (!lastMissingArray.length) {
      alert("No missing receipt numbers found.");
      return;
    }
    displaySQL(type, lastMissingArray);
  }

  function displaySQL(type, missingArray) {
    const sqlOutput = document.getElementById("sqlOutput");
    const formatted = missingArray.map(n => `"${n}"`).join(", ");
    let sqlQuery = "";

    if (type === "SELECT") {
      sqlQuery = `SELECT * FROM pos_sale WHERE fdocument_no IN (${formatted});`;
    } else if (type === "DELETE") {
      sqlQuery = `DELETE FROM pos_sale WHERE fdocument_no NOT IN (${formatted});\n\n` +
                 `DELETE FROM pos_sale_payment WHERE frecno NOT IN (SELECT frecno FROM pos_sale);\n` +
                 `DELETE FROM pos_sale_product WHERE frecno NOT IN (SELECT frecno FROM pos_sale);`;
    }

    sqlOutput.textContent = sqlQuery;
    sqlOutput.style.display = "block";
  }

  function toggleSQLVisibility() {
    const sqlOutput = document.getElementById("sqlOutput");
    sqlOutput.style.display = sqlOutput.style.display === "block" ? "none" : "block";
  }

  function copySQL() {
    const sqlOutput = document.getElementById("sqlOutput");
    navigator.clipboard.writeText(sqlOutput.textContent).then(() => {
      alert("SQL copied to clipboard!");
    });
  }

  function clearOutput() {
    document.getElementById("output").textContent = "";
    document.getElementById("sqlOutput").style.display = "none";
    document.getElementById("sqlControls").style.display = "none";
    document.getElementById("downloadBtn").style.display = "none";
    lastMissingArray = [];
    lastDuplicateArray = [];
  }

  // Drag & Drop support
  const dropArea = document.getElementById("dropArea");
  const fileInput = document.getElementById("fileInput");

  ["dragenter", "dragover"].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.remove("dragover");
    });
  });

  dropArea.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files;
  });

  // Attach event listeners to buttons
  document.getElementById("checkBtn").addEventListener("click", processFiles);
  document.getElementById("clearBtn").addEventListener("click", clearOutput);
  document.getElementById("showSQLBtn").addEventListener("click", toggleSQLVisibility);
  document.getElementById("copyBtn").addEventListener("click", copySQL);
  document.getElementById("selectSQLBtn").addEventListener("click", () => generateSQL("SELECT"));
  document.getElementById("deleteSQLBtn").addEventListener("click", () => generateSQL("DELETE"));
});
