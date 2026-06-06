let dataset = [];

// Genshin Assets Dictionary for Icons and Colors
const genshinAssets = {
    elements: {
        "pyro": { color: "#EC4923", icon: "https://genshin-impact.fandom.com/wiki/Special:FilePath/Element_Pyro.png" },
        "hydro": { color: "#00BFFF", icon: "https://genshin-impact.fandom.com/wiki/Special:FilePath/Element_Hydro.png" },
        "anemo": { color: "#359697", icon: "https://genshin-impact.fandom.com/wiki/Special:FilePath/Element_Anemo.png" },
        "electro": { color: "#945DC4", icon: "https://genshin-impact.fandom.com/wiki/Special:FilePath/Element_Electro.png" },
        "dendro": { color: "#608A00", icon: "https://genshin-impact.fandom.com/wiki/Special:FilePath/Element_Dendro.png" },
        "cryo": { color: "#46A8BA", icon: "https://genshin-impact.fandom.com/wiki/Special:FilePath/Element_Cryo.png" },
        "geo": { color: "#DEBD6C", icon: "https://genshin-impact.fandom.com/wiki/Special:FilePath/Element_Geo.png" }
    },
    weapons: {
        "sword": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Icon_Sword.png",
        "claymore": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Icon_Claymore.png",
        "polearm": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Icon_Polearm.png",
        "bow": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Icon_Bow.png",
        "catalyst": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Icon_Catalyst.png"
    },
    regions: {
        "mondstadt": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Emblem_Mondstadt.png",
        "liyue": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Emblem_Liyue.png",
        "inazuma": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Emblem_Inazuma.png",
        "sumeru": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Emblem_Sumeru.png",
        "fontaine": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Emblem_Fontaine.png",
        "natlan": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Emblem_Natlan.png",
        "snezhnaya": "https://genshin-impact.fandom.com/wiki/Special:FilePath/Emblem_Snezhnaya.png"
    }
};

let uniqueQualities = new Set();
let uniqueElements = new Set();
let uniqueWeapons = new Set();
let uniqueRegions = new Set();
let minVerLimit = 999;
let maxVerLimit = 0;

// 1. Handle CSV file reading
document.getElementById('csvFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        parseCSV(text);
    };
    reader.readAsText(file);
});

function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const charIdx = headers.indexOf('character');
    const qualIdx = headers.indexOf('quality');
    const elemIdx = headers.indexOf('element');
    const weapIdx = headers.indexOf('weapon');
    const regIdx = headers.indexOf('region');
    const verIdx = headers.indexOf('version');

    if (charIdx === -1 || qualIdx === -1 || elemIdx === -1 || weapIdx === -1 || regIdx === -1 || verIdx === -1) {
        alert("Error: CSV structure is missing one or more required headers.");
        return;
    }

    dataset = [];
    uniqueQualities.clear();
    uniqueElements.clear();
    uniqueWeapons.clear();
    uniqueRegions.clear();
    minVerLimit = 999;
    maxVerLimit = 0;

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length <= Math.max(charIdx, qualIdx, elemIdx, weapIdx, regIdx, verIdx)) continue;

        const charObj = {
            Character: cols[charIdx],
            Quality: cols[qualIdx],
            Element: cols[elemIdx],
            Weapon: cols[weapIdx],
            Region: cols[regIdx],
            Version: parseFloat(cols[verIdx])
        };

        dataset.push(charObj);
        uniqueQualities.add(charObj.Quality);
        uniqueElements.add(charObj.Element);
        uniqueWeapons.add(charObj.Weapon);
        uniqueRegions.add(charObj.Region);
        
        if (charObj.Version < minVerLimit) minVerLimit = charObj.Version;
        if (charObj.Version > maxVerLimit) maxVerLimit = charObj.Version;
    }
    
    document.getElementById('loadStatus').innerText = `🌸 Success: Loaded ${dataset.length} characters dynamically!`;
    buildFiltersUI();
    document.getElementById('filterCard').style.display = 'block';
}

// 2. Build Checkboxes dynamically with Icons
function buildFiltersUI() {
    const container = document.getElementById('dynamicFilters');
    container.innerHTML = '';

    container.appendChild(createFilterGroup('Quality', uniqueQualities, 'quality-cb'));
    container.appendChild(createFilterGroup('Element', uniqueElements, 'element-cb'));
    container.appendChild(createFilterGroup('Weapon', uniqueWeapons, 'weapon-cb'));
    container.appendChild(createFilterGroup('Region', uniqueRegions, 'region-cb'));

    document.getElementById('minVersion').value = minVerLimit;
    document.getElementById('maxVersion').value = maxVerLimit;
}

function getAssetHTML(type, value) {
    const lowerVal = value.toLowerCase();
    let html = '';

    if (type === 'Quality') {
        const color = value == '5' ? 'var(--quality-5)' : 'var(--quality-4)';
        html = `<span style="color: ${color}; font-weight: bold; font-size: 1.1rem;">${value}★</span>`;
    } 
    else if (type === 'Element' && genshinAssets.elements[lowerVal]) {
        const data = genshinAssets.elements[lowerVal];
        html = `<img src="${data.icon}" class="asset-icon" onerror="this.style.display='none'"> <span style="color: ${data.color}; font-weight: bold;">${value}</span>`;
    } 
    else if (type === 'Weapon' && genshinAssets.weapons[lowerVal]) {
        html = `<img src="${genshinAssets.weapons[lowerVal]}" class="asset-icon" onerror="this.style.display='none'"> <span>${value}</span>`;
    } 
    else if (type === 'Region' && genshinAssets.regions[lowerVal]) {
        html = `<img src="${genshinAssets.regions[lowerVal]}" class="asset-icon" onerror="this.style.display='none'"> <span>${value}</span>`;
    } 
    else {
        html = `<span>${value}</span>`; // Fallback for 'None' or missing assets
    }

    return html;
}

function createFilterGroup(title, dataSet, className) {
    const group = document.createElement('div');
    group.className = 'filter-group';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'filter-title';
    titleDiv.innerText = `Possible ${title}s`;
    group.appendChild(titleDiv);

    const grid = document.createElement('div');
    grid.className = 'checkbox-grid';

    let items = Array.from(dataSet).sort();
    items.forEach(item => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" class="${className}" value="${item}" checked> 
            ${getAssetHTML(title, item)}
        `;
        grid.appendChild(label);
    });

    group.appendChild(grid);
    return group;
}

// QoL: Reset Button Function
function resetFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
    document.getElementById('minVersion').value = minVerLimit;
    document.getElementById('maxVersion').value = maxVerLimit;
    processLogic();
}

// 3. Primary Logic - Filter Pool and Calculate Next Guess
function processLogic() {
    const getCheckedValues = (className) => {
        return Array.from(document.querySelectorAll(`.${className}:checked`)).map(cb => cb.value.toLowerCase());
    };

    const activeQualities = getCheckedValues('quality-cb');
    const activeElements = getCheckedValues('element-cb');
    const activeWeapons = getCheckedValues('weapon-cb');
    const activeRegions = getCheckedValues('region-cb');
    
    const userMinVer = parseFloat(document.getElementById('minVersion').value) || 0;
    const userMaxVer = parseFloat(document.getElementById('maxVersion').value) || 999;

    let pool = dataset.filter(target => {
        const qMatch = activeQualities.includes(target.Quality.toString().toLowerCase());
        const eMatch = activeElements.includes(target.Element.toLowerCase());
        const wMatch = activeWeapons.includes(target.Weapon.toLowerCase());
        const rMatch = activeRegions.includes(target.Region.toLowerCase());
        const vMatch = target.Version >= userMinVer && target.Version <= userMaxVer;

        return qMatch && eMatch && wMatch && rMatch && vMatch;
    });

    // Render Results Table
    document.getElementById('resultsSection').style.display = 'grid';
    document.getElementById('poolCount').innerText = pool.length;

    const tbody = document.querySelector('#poolTable tbody');
    tbody.innerHTML = '';
    pool.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.Character}</strong></td>
            <td>${getAssetHTML('Quality', c.Quality)}</td>
            <td>${getAssetHTML('Element', c.Element)}</td>
            <td>${getAssetHTML('Weapon', c.Weapon)}</td>
            <td>${getAssetHTML('Region', c.Region)}</td>
            <td>${c.Version.toFixed(1)}</td>`;
        tbody.appendChild(tr);
    });

    calculateBestNextGuess(pool);
}

// 4. Minimax Processing Engine
function calculateBestNextGuess(pool) {
    const recArea = document.getElementById('recommendationArea');
    if (pool.length === 0) {
        recArea.innerHTML = "<p style='color:#d32f2f; font-weight:bold;'>No characters match the current filters. Please re-check your options.</p>";
        return;
    }
    if (pool.length === 1) {
        recArea.innerHTML = `<div class="recommendation-box"><p>Only one choice left! Target found:</p><div class="highlight-name">🌟 ${pool[0].Character}</div></div>`;
        return;
    }

    let optimalSelection = null;
    let lowestMaxGroup = Infinity;
    let choiceInPool = false;

    for (let candidate of dataset) {
        let signatureGroups = {};

        for (let target of pool) {
            const q = target.Quality.toString() === candidate.Quality.toString();
            const e = target.Element.toLowerCase() === candidate.Element.toLowerCase();
            const w = target.Weapon.toLowerCase() === candidate.Weapon.toLowerCase();
            const r = target.Region.toLowerCase() === candidate.Region.toLowerCase();
            
            let v = 'equal';
            if (parseFloat(target.Version) > parseFloat(candidate.Version)) v = 'up';
            else if (parseFloat(target.Version) < parseFloat(candidate.Version)) v = 'down';

            const patternKey = `${q}-${e}-${w}-${r}-${v}`;
            signatureGroups[patternKey] = (signatureGroups[patternKey] || 0) + 1;
        }

        const currentMaxGroup = Math.max(...Object.values(signatureGroups));
        const currentInPool = pool.some(p => p.Character === candidate.Character);

        if (currentMaxGroup < lowestMaxGroup || 
           (currentMaxGroup === lowestMaxGroup && currentInPool && !choiceInPool)) {
            lowestMaxGroup = currentMaxGroup;
            optimalSelection = candidate;
            choiceInPool = currentInPool;
        }
    }

    if (optimalSelection) {
        const charIconHtml = getAssetHTML('Element', optimalSelection.Element);
        
        recArea.innerHTML = `
            <div class="recommendation-box">
                <p style="color: var(--text-muted); font-weight: bold; margin-bottom: 5px;">Suggested Next Guess:</p>
                <div class="highlight-name">${optimalSelection.Character} ${charIconHtml.includes('img') ? charIconHtml.split('<span')[0] : ''}</div>
                <p style="margin-top:15px; font-size:0.95rem; line-height:1.5;">
                    <strong>Strategy Analysis:</strong> Guessing <b>${optimalSelection.Character}</b> safely breaks the remaining ${pool.length} candidates into distinct profiles based on the game's feedback. In the absolute worst-case scenario, the candidate pool will instantly shrink down to a maximum of <strong>${lowestMaxGroup}</strong> item(s).
                </p>
                <p style="font-size:0.85rem; color:var(--text-muted); background: var(--bg-page); padding: 10px; border-radius: 8px; margin-top: 10px;">
                    ${choiceInPool ? "🎯 <b>In Pool:</b> This character is among the remaining candidates. You win instantly if they are the target." : "⚠️ <b>Sacrificial Pick:</b> This character is an outside tactical pick designed specifically to partition the remaining pool cleanly."}
                </p>
            </div>
        `;
    }
}
