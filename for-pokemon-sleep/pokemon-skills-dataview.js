const today = dv.current().file.name; // "2026-02-19" 形式
const pokemonLogs = 'Pokémon_Sleep/Pokémon_Logs'; // ポケモンログの保管場所

// ゲーム内の日付範囲を計算（午前4:00基準）
const gameDayStart = new Date(today + 'T04:00:00');
const gameDayEnd = new Date(gameDayStart.getTime() + 24 * 60 * 60 * 1000); // 翌日午前4:00
const currentTime = new Date();

// その日のデータを収集
let dailyData = [];

for (let file of dv.pages(`"${pokemonLogs}"`)) {
    let events = [];

    // その日のすべてのイベントを収集
    for (let item of file.file.lists) {
        let time = gameDayStart;
        let type = '';

        if (item.in) {
            time = new Date(item.in.toString());
            type = 'in';
        }

        if (item.out) {
            time = new Date(item.out.toString());
            type = 'out';
        }

        if (item.skill) {
            time = new Date(item.skill.toString());
            type = 'skill';
        }

        if (withinThisGameDay(time)) {
            events.push({ type, time });
        }
    }

    // 時系列順にソート
    events.sort((a, b) => a.time - b.time);

    // その日の編成時間とスキル回数を計算
    let totalMinutes = 0;
    let skillCount = 0;
    let isWorking = false;
    let inTime = gameDayStart;

    for (let event of events) {
        if (event.type === 'out' && !isWorking) {
            inTime = gameDayStart;
            totalMinutes += calcWorkingTime(event.time, inTime);
        } else if (event.type === 'out' && isWorking) {
            totalMinutes += calcWorkingTime(event.time, inTime);
            isWorking = false;
        } else if (event.type === 'in') {
            isWorking = true;
            inTime = event.time;
        } else if (event.type === 'skill') {
            skillCount++;
            isWorking = true;
        }
    }

    // 日付終了時点でまだ編成中の場合
    if (isWorking) {
        const outTime = withinThisGameDay(currentTime) ? currentTime : gameDayEnd;
        totalMinutes += (outTime - inTime) / (1000 * 60);
    }

    // データがある場合のみ追加
    if (totalMinutes > 0 || skillCount > 0) {
        const hours = (totalMinutes / 60).toFixed(1);
        const rate = totalMinutes > 0 ? (skillCount / (totalMinutes / 60)).toFixed(2) : '0.00';

        dailyData.push({
            name: file.name,
            hours: hours,
            skills: skillCount,
            rate: rate,
        });
    }
}

if (dailyData.length > 0) {
    dv.table(
        ['ポケモン', '編成時間', 'スキル発動回数', '発動率(/時)'],
        dailyData.map((d) => [d.name, d.hours + 'h', d.skills, d.rate]),
    );
} else {
    dv.paragraph('この日は編成されたポケモンがいません。');
}

// その日の午前4:00から翌日の3:59までのイベントかどうかを判定
function withinThisGameDay(time) {
    return time >= gameDayStart && time < gameDayEnd;
}

function calcWorkingTime(outTime, inTime) {
    return (outTime - inTime) / (1000 * 60);
}
