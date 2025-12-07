let jsonCopy = null;

function jsonToXml(obj, level = 0, tagName = "null") {
  const indent = '  '.repeat(level);
  const newline = '\n';

  if (typeof obj !== 'object' || obj === null) return '';

  // Gestione nodi multipli
  if (Array.isArray(obj.list)) {
    return obj.list
      .map(item => jsonToXml(item, level, tagName))
      .join('');
  }

  if (obj.selected === false) return '';

  const children = [];
  let innerText = '';
  let attributesString = '';

  const pre = obj.pre || '';
  const fullTagName = pre ? `${pre}:${tagName}` : tagName;

  // Attributi
  if (obj.attributes) {
    const attrs = [];
    for (const attrKey in obj.attributes) {
      const attr = obj.attributes[attrKey];
      if (attr.selected !== false && attr.value !== undefined) {
        attrs.push(`${attrKey}="${attr.value}"`);
      }
    }
    attributesString = attrs.length ? ' ' + attrs.join(' ') : '';
  }

  // Value diretto
  if ('value' in obj && typeof obj.value === 'string') {
    innerText = obj.value;
  }

  // Figli (escludendo attributes)
  for (const key in obj) {
    if (['value', 'selected', 'attributes', 'multiple', 'pre'].includes(key)) continue;
    const childXml = jsonToXml(obj[key], level + 1, key);
    if (childXml) children.push(childXml);
  }

  const innerXml = children.join('');
  const hasValue = innerText.trim() !== '';
  const hasChildren = children.length > 0;

  // Forma compatta se non ha value né figli
  if (!hasValue && !hasChildren) {
    return `${indent}<${fullTagName}${attributesString}/>${newline}`;
  }

  // Solo valore (con o senza attributi)
  if (hasValue && !hasChildren) {
    if (attributesString) {
      return (
        /**
        `${indent}<${fullTagName}${attributesString}>${newline}` +
        `${indent}${innerText}${newline}` +
        `${indent}</${fullTagName}>${newline}`
         */
        `${indent}<${fullTagName}${attributesString}>${innerText}</${fullTagName}>${newline}`
      );
    } else {
      return `${indent}<${fullTagName}>${innerText}</${fullTagName}>${newline}`;
    }
  }

  // Valore + figli o solo figli
  let xml = `${indent}<${fullTagName}${attributesString}>${newline}`;
  if (hasValue) {
    xml += `${indent}  ${innerText}${newline}`;
  }
  xml += innerXml;
  xml += `${indent}</${fullTagName}>${newline}`;
  return xml;
}

// Funzione wrapper per xml con root corretto
function jsonToXmlRoot(obj) {
  const rootKeys = Object.keys(obj);
  if (rootKeys.length !== 1) {
    console.warn("JSON root should have exactly one key");
    return jsonToXml(obj, 0, "root");
  }
  const rootTag = rootKeys[0];
  return jsonToXml(obj[rootTag], 0, rootTag);
}

function makePath(parentPath, key, index) {
  if (typeof index === 'number') return `${parentPath}.${key}[${index}]`;
  return parentPath ? `${parentPath}.${key}` : key;
}

function getAtPath(obj, path) {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  return keys.reduce((o, k) => (o ? o[k] : undefined), obj);
}

function setAtPath(obj, path, value) {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in cur)) return false;
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return true;
}

function renderNode(parent, node, path, tagName = null) {
  if (typeof node !== 'object' || node === null) {
    const container = document.createElement('div');
    container.className = 'node simple';
    const label = document.createElement('label');
    label.textContent = (tagName ?? path.split('.').slice(-1)[0]) + ': ';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = node;
    input.dataset.path = path;
    input.oninput = e => setAtPath(jsonCopy, e.target.dataset.path, e.target.value);
    label.appendChild(input);
    container.appendChild(label);
    parent.appendChild(container);
    return;
  }

  // GESTIONE SPECIALE ATTRIBUTES
  if (tagName === 'attributes') {
    const container = document.createElement('div');
    container.className = 'node attributes-container';

    const label = document.createElement('div');
    label.className = 'attributes-label';
    label.textContent = 'attributes:';
    container.appendChild(label);

    for (const key in node) {
      const attr = node[key];
      const row = document.createElement('div');
      row.className = 'tag-header';

      // Checkbox per selected
      if ('selected' in attr) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = attr.selected;
        checkbox.dataset.path = `${path}.${key}.selected`;
        checkbox.onchange = e => {
          setAtPath(jsonCopy, e.target.dataset.path, e.target.checked);
          rerender();
        };
        row.appendChild(checkbox);
      } else {
        const spacer = document.createElement('span');
        spacer.style.display = 'inline-block';
        spacer.style.width = '20px';
        row.appendChild(spacer);
      }

      // Label con nome attributo e uguale
      const label = document.createElement('span');
      label.textContent = `${key} = `;
      label.style.marginRight = '6px';
      row.appendChild(label);

      // Input o Select per value con supporto options
      if ('value' in attr) {
        if (typeof attr.options === 'string') {
          // Dropdown select
          const select = document.createElement('select');
          select.dataset.path = `${path}.${key}.value`;

          const options = attr.options.split('|');
          options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt;
            optionEl.textContent = opt;
            if (attr.value === opt) optionEl.selected = true;
            select.appendChild(optionEl);
          });

          select.onchange = e => {
            setAtPath(jsonCopy, e.target.dataset.path, e.target.value);
            rerender();
          };

          row.appendChild(select);
        } else {
          // Input testuale normale
          const input = document.createElement('input');
          input.type = 'text';
          input.value = attr.value;
          input.dataset.path = `${path}.${key}.value`;
          input.oninput = e => {
            setAtPath(jsonCopy, e.target.dataset.path, e.target.value);
          };
          row.appendChild(input);
        }
      }

      container.appendChild(row);
    }

    parent.appendChild(container);
    return;
  }


  // MULTIPLES NODES (no extra wrapper)
  if ( Array.isArray(node.list)) {
    node.list.forEach((item, i) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'array-item';

      renderNode(itemDiv, item, `${path}.list[${i}]`, tagName);

      if (node.list.length > 1 && node.multiple === true ) {
        const delBtn = document.createElement('button');
        delBtn.textContent = '-';
        delBtn.title = 'Rimuovi elemento';
        delBtn.onclick = () => {
          node.list.splice(i, 1);
          rerender();
        };
        itemDiv.appendChild(delBtn);
      }

      parent.appendChild(itemDiv);
    });

    if (node.multiple === true ){
      const addBtn = document.createElement('button');
      addBtn.textContent = '+';
      addBtn.title = 'Aggiungi elemento';
      addBtn.onclick = () => {
        const newItem = JSON.parse(JSON.stringify(node.list[0]));
        node.list.push(newItem);
        rerender();
      };
      parent.appendChild(addBtn);
    }

    return;
  }

  // NODE NORMAL OBJECT
  const container = document.createElement('div');
  container.className = 'node object';

  const horizontal = document.createElement('div');
  horizontal.className = 'tag-header';

  if ('selected' in node) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = node.selected;
    checkbox.dataset.path = path + '.selected';
    checkbox.onchange = e => {
      const isChecked = e.target.checked;
      const path = e.target.dataset.path;
      const nodePath = path.replace(/\.selected$/, '');
      const nodeRef = getAtPath(jsonCopy, nodePath);

      setAtPath(jsonCopy, path, isChecked);

      if (!isChecked && nodeRef) {
        deselectAll(nodeRef);
      }

      rerender();
    };
    horizontal.appendChild(checkbox);
  } else {
    const spacer = document.createElement('span');
    spacer.style.display = 'inline-block';
    spacer.style.width = '20px';
    horizontal.appendChild(spacer);
  }

  let pre = node.pre || '';
  let tagLabel = pre ? `<${pre}:${tagName}>` : `<${tagName}>`;
  const tagSpan = document.createElement('span');
  tagSpan.className = 'tag-name-text';
  tagSpan.textContent = tagLabel;
  horizontal.appendChild(tagSpan);

  if ('value' in node) {
    /*
    2 cases:
      1) X509Certificate -> inputfile + value
      2) options -> dropdown (no value)
    */

    if (node.options) {
      const select = document.createElement('select');
      select.dataset.path = path + '.value';

      const opts = node.options.split('|');
      opts.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === node.value) option.selected = true;
        select.appendChild(option);
      });

      select.onchange = e => setAtPath(jsonCopy, e.target.dataset.path, e.target.value);
      horizontal.appendChild(select);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = node.value;
      input.dataset.path = path + '.value';
      input.oninput = e => setAtPath(jsonCopy, e.target.dataset.path, e.target.value);
      horizontal.appendChild(input);
    }
  }


  container.appendChild(horizontal);

  for (const key in node) {
    if (['selected', 'value', 'multiple', 'pre', 'options'].includes(key)) continue;
    renderNode(container, node[key], makePath(path, key), key);
  }

  parent.appendChild(container);
}

// Function to start from the root in the DOM
function renderRoot() {
  const editor = document.getElementById('editor');
  editor.innerHTML = '';
  if (!jsonCopy) return;
  const rootKeys = Object.keys(jsonCopy);
  if (rootKeys.length !== 1) {
    // fallback o errore
    renderNode(editor, jsonCopy, '', 'root');
  } else {
    const rootTag = rootKeys[0];
    renderNode(editor, jsonCopy[rootTag], rootTag, rootTag);
  }
}

function rerender() {
  renderRoot();
}

document.getElementById('printJson').onclick = () => {
  const xmlOutput = jsonToXmlRoot(jsonCopy);
  console.log(xmlOutput);
  document.getElementById('output').textContent = xmlOutput;
};

document.getElementById('copyBtn').addEventListener('click', function () {
    const content = document.getElementById('output').innerText;
    navigator.clipboard.writeText(content).then(() => {
        alert('Contenuto copiato negli appunti!');
    }).catch(err => {
        alert('Errore nella copia: ' + err);
    });
});

document.getElementById('downloadBtn').addEventListener('click', function () {
    const content = document.getElementById('output').innerText;
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'file.xml';
    a.click();

    URL.revokeObjectURL(url); // clean up
});

fetch('file.json')
  .then(res => res.json())
  .then(data => {
    jsonCopy = JSON.parse(JSON.stringify(data));
    rerender();
  })
  .catch(e => {
    document.getElementById('output').textContent = 'Errore caricamento JSON: ' + e;
  });

// helper function to deselect all (used in renderNode)
function deselectAll(node) {
  if (typeof node !== 'object' || node === null) return;
  if ('selected' in node) node.selected = false;
  for (const key in node) {
    if (['selected'].includes(key)) continue;
    if (typeof node[key] === 'object') deselectAll(node[key]);
  }
}

/* UPLOAD CERTIFICATE */
document.getElementById('certUpload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  console.log(file);
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    let content = e.target.result;

    // Split per righe e filtra fuori BEGIN e END
    let lines = content.split(/\r?\n/);
    lines = lines.filter(line => {
      return line.trim() !== '' &&
             !line.includes('BEGIN CERTIFICATE') &&
             !line.includes('END CERTIFICATE');
    });

    const cleaned = lines.join('');

    console.log(cleaned);

    // Update jsonCopy in value
    console.log(jsonCopy.EntityDescriptor.SPSSODescriptor.KeyDescriptor)
    jsonCopy.EntityDescriptor.SPSSODescriptor.KeyDescriptor.list[0].KeyInfo.X509Data.X509Certificate.value = cleaned;

    // Update UI
    rerender();

    console.log('Updated jsonCopy:', jsonCopy);
  };

  reader.readAsText(file);
});
