const pokemonLogs = 'Pokémon_Sleep/Pokémon_Logs'; // ポケモンログの保管場所

// ポケモンリストを取得
const pokemonFiles = dv.pages(`"${pokemonLogs}"`).sort((p) => p.name);

// UIを構築
const container = dv.container;
container.innerHTML = `
<div style="padding: 15px; border: 2px solid var(--interactive-accent); border-radius: 8px; background: var(--background-secondary);">
    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <div>
            <label for="pokemon-select" style="display: block; margin-bottom: 5px; font-weight: bold;">ポケモン:</label>
            <select id="pokemon-select" style="padding: 8px; border-radius: 4px; min-width: 150px;">
                <option value="">選択してください</option>
                ${pokemonFiles.map((p) => `<option value="${p.file.path}">${p.name}</option>`).join('')}
            </select>
        </div>

        <div>
            <label for="action-select" style="display: block; margin-bottom: 5px; font-weight: bold;">アクション:</label>
            <select id="action-select" style="padding: 8px; border-radius: 4px; min-width: 130px;">
                <option value="">選択してください</option>
                <option value="in">出勤</option>
                <option value="out">退勤</option>
                <option value="skill">スキル発動</option>
            </select>
        </div>

        <div style="align-self: flex-end;">
            <button id="record-button" style="padding: 8px 20px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                記録
            </button>
        </div>
    </div>

    <div id="status-message" style="margin-top: 10px; padding: 8px; border-radius: 4px; display: none;"></div>
</div>
`;

// ボタンのイベントリスナー
const recordButton = container.querySelector('#record-button');
const statusMessage = container.querySelector('#status-message');

recordButton.addEventListener('click', async () => {
    const pokemonPath = container.querySelector('#pokemon-select').value;
    const action = container.querySelector('#action-select').value;

    if (!pokemonPath || !action) {
        showStatus('ポケモンとアクションを選択してください', 'error');
        return;
    }

    try {
        // ファイルを読み込む
        const file = app.vault.getAbstractFileByPath(pokemonPath);
        if (!file) {
            showStatus('ファイルが見つかりません', 'error');
            return;
        }

        const content = await app.vault.read(file);
        const currentTime = getLocalTimeString();

        // アクションに応じたタグを設定
        const tags = {
            in: '#出勤',
            out: '#退勤',
            skill: '#スキル発動',
        };

        const actionTag = tags[action];
        const newLine = `- [${action}:: ${currentTime}] ${actionTag}`;

        // ファイルの最後に追加
        let newContent;
        if (content.includes('# おてつだい記録')) {
            // 既におてつだい記録セクションがある場合
            newContent = content + '\n' + newLine;
        } else {
            // おてつだい記録セクションがない場合は作成
            newContent = content + '\n# おてつだい記録\n' + newLine;
        }

        await app.vault.modify(file, newContent);

        showStatus(
            `✓ ${pokemonFiles.find((p) => p.file.path === pokemonPath).name}の${actionTag}を記録しました`,
            'success',
        );

        // 選択をリセット
        container.querySelector('#pokemon-select').value = '';
        container.querySelector('#action-select').value = '';
    } catch (error) {
        showStatus('記録に失敗しました: ' + error.message, 'error');
    }
});

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    statusMessage.style.color = type === 'success' ? 'var(--text-success)' : 'var(--text-error)';

    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

function getLocalTimeString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}
