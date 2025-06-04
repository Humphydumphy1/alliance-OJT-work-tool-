    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('xmlFile');
    const progress = document.getElementById('progress');
    const output = document.getElementById('outputMsg');

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      fileInput.files = e.dataTransfer.files;
    });

    function clearOutput() {
      output.innerText = '';
      output.className = 'output';
      output.style.display = 'none';
      progress.innerText = '';
    }

    function processFiles() {
      const tenantId = document.getElementById('tenantId').value.trim();
      const tenantKey = document.getElementById('tenantKey').value.trim();
      const files = Array.from(fileInput.files);

      clearOutput();

      if (!tenantId || !tenantKey || files.length === 0) {
        alert("Please provide Tenant ID, Tenant Key, and at least one XML file.");
        return;
      }

      let processedCount = 0;
      const totalFiles = files.length;
      output.style.display = 'block';

      files.forEach(file => {
        const reader = new FileReader();

        reader.onload = function(event) {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(event.target.result, "text/xml");

            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
              throw new Error("Malformed XML");
            }

            const tenantIdNode = xmlDoc.querySelector("tenantid");
            const keyNode = xmlDoc.querySelector("key");

            if (!tenantIdNode || !keyNode) {
              throw new Error("<tenantid> or <key> tag missing");
            }

            tenantIdNode.textContent = tenantId;
            keyNode.textContent = tenantKey;

            let terminalID = "0000";
            let fzCounter = "00000";

            const parts = file.name.replace(".xml", "").split("_");
            if (parts.length >= 3) {
              terminalID = parts[parts.length - 2];
              fzCounter = parts[parts.length - 1];
            } else {
              const tmidTag = xmlDoc.querySelector("tmid");
              if (tmidTag) terminalID = tmidTag.textContent.padStart(4, '0');
            }

            const serializer = new XMLSerializer();
            const updatedXML = serializer.serializeToString(xmlDoc);
            const newFilename = `sales_${tenantId}_${terminalID}_${fzCounter}.xml`;

            const blob = new Blob([updatedXML], { type: "text/xml" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = newFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            output.innerHTML += `<div class="file-status success">${file.name} → ${newFilename}</div>`;
          } catch (error) {
            output.innerHTML += `<div class="file-status error">${file.name} — ${error.message}</div>`;
          } finally {
            processedCount++;
            progress.innerText = `Progress: ${processedCount} of ${totalFiles} files processed.`;
          }
        };

        reader.onerror = () => {
          output.innerHTML += `<div class="file-status error">Failed to read ${file.name}</div>`;
          processedCount++;
          progress.innerText = `Progress: ${processedCount} of ${totalFiles} files processed.`;
        };

        reader.readAsText(file);
      });
    }