document.addEventListener("DOMContentLoaded", () => {
  let lastMissingArray = [];

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
          groupedByDate[date].push(receipt);
        }

        for (let date in groupedByDate) {
          const receipts = groupedByDate[date].map(r => Number(r)).sort((a, b) => a - b);
          let missing = [];

          for (let i = 1; i < receipts.length; i++) {
            const prev = receipts[i - 1];
            const curr = receipts[i];
            for (let j = prev + 1; j < curr; j++) {
              missing.push(j);
            }
          }

          if (!allMissing[date]) allMissing[date] = [];
          allMissing[date] = allMissing[date].concat(missing);
        }

        processedCount++;
        if (processedCount === files.length) finalizeOutput();
      };

      reader.readAsArrayBuffer(file);
    }

    function finalizeOutput() {
      let message = `MISSING RECEIPT NUMBERS BY DATE\n\n`;
      let allMissingFlat = [];

      for (let date in allMissing) {
        const list = allMissing[date];
        if (list.length) {
          message += `${date}:\n${list.join(", ")}\n\n`;
          allMissingFlat.push(...list);
        }
      }

      if (allMissingFlat.length === 0) {
        message += "No missing receipt numbers found.";
        sqlOutput.style.display = "none";
        sqlControls.style.display = "none";
        lastMissingArray = [];
      } else {
        const uniqueSorted = [...new Set(allMissingFlat)].sort((a, b) => a - b);
        lastMissingArray = uniqueSorted;
        displaySQL("SELECT", lastMissingArray);
        sqlControls.style.display = "flex";
      }

      output.textContent = message;
      downloadBtn.style.display = "inline-block";

      downloadBtn.onclick = function () {
        const blob = new Blob([message], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "missing_ORs_by_date.txt";
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
