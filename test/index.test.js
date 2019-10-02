import App from '../src/index';
import template from './template';
import moment from 'moment';
/* eslint-disable eol-last */

describe('displayTime', () => {
    test('初期化時に25:00を表示する', () => {
        document.body.innerHTML = template;
        const app = new App();
        const timeDisplay = document.getElementById('time-display');
        expect(app.isTimerStopped).toBeTruthy();//初期設定でタイマーは止まっている
        expect(timeDisplay.innerHTML).toEqual('25:00');
    });

    test('カウントダウン中の時間を適切に表示する', () => {
        document.body.innerHTML = template;
        const app = new App();
        const now = moment();
        const startOfToday = now.startOf('day');
        // タイマースタート後の状態を作り出す
        app.startButton.disabled = true;
        app.stopButton.disabled = false;
        app.isTimerStopped = false;
        app.startAt = startOfToday;
        app.endAt = moment(startOfToday).add(25, 'minutes');
        // タイマースタートしてから51秒後の時間でテストを行う
        app.displayTime(moment(startOfToday).add(51, 'seconds'));
        const timeDisplay = document.getElementById('time-display');
        expect(timeDisplay.innerHTML).toEqual('24:09');
    });
});

describe('startTimer', () => {
    test('スタートボタンにdisable属性を追加', () => {
        document.body.innerHTML = template;
        const app = new App();
        app.startTimer();
        const startButton = document.getElementById('start-button');
        const stopButton = document.getElementById('stop-button');
        expect(startButton.disabled).toEqual(true);
        expect(stopButton.disabled).toEqual(false);
        expect(app.isTimerStopped).toEqual(false);
    });

    test('startAtとendAtを適切に設定する', () => {
        document.body.innerHTML = template;
        const app = new App();
        const now = moment(); // 現在時刻のmomentインスタンスを作成
        app.startTimer(null, now);
        expect(app.startAt.valueOf()).toEqual(now.valueOf()); // startAtに現在時刻が与えられているかテスト
        expect(app.endAt.valueOf()).toEqual(now.add(25, 'minutes').valueOf());
        // endAtがstartAtから25分後になっているかテスト
    })
});
// カウントダウンが0秒になった時の切り替えを表示する
describe('updateTimer', () => {
    test('タイムディスプレイを更新する', () => {
        document.body.innerHTML = template;
        const app = new App();
        const now = moment();
        const startOfToday = now.startOf('day');
        app.startButton.disabled = true;
        app.stopButton.disabled = false;
        app.isTimerStopped = false;
        app.startAt = startOfToday;
        app.endAt = moment(startOfToday).add(25, 'minutes');
        app.updateTimer(moment(startOfToday).add(10, 'seconds'));
        const timeDisplay = document.getElementById('time-display');
        expect(timeDisplay.innerHTML).toEqual('24:50');
    });

    test('作業時間が終わったら休憩時間に切り替える', () => {
        document.body.innerHTML = template;
        const app = new App();
        const now = moment();
        const startOfToday = now.startOf('day');
        // 作業中の状態を作り出す
        app.startButton.disabled = true;
        app.stopButton.disabled = false;
        app.isTimerStopped = false;
        app.startAt = startOfToday;
        app.endAt = moment(startOfToday).add(25, 'minutes');
        // 終了時刻から100ミリ秒後時間でテストを行う
        app.updateTimer(moment(startOfToday).add(25, 'minutes').add(100, 'millisecond'));
        const timeDisplay = document.getElementById('time-display');
        expect(timeDisplay.innerHTML).toEqual('5:00');
        expect(app.onWork).not.toBeTruthy(); // 休憩時間に切り替わっている
    });

    test('休憩時間が終わったら作業時間に切り替える', () => {
        document.body.innerHTML = template;
        const app = new App();
        const now = moment();
        const startOfToday = now.startOf('day');
        // 休憩中の状態を作り出す
        app.onWork = false;
        app.startButton.disabled = true;
        app.stopButton.disabled = false;
        app.isTimerStopped = false;
        app.startAt = startOfToday;
        app.endAt = moment(startOfToday).add(5, 'minutes');
        // 終了時間から100ミリ秒後の時間でテストを行う
        app.updateTimer(moment(startOfToday).add(5, 'minutes').add(100, 'millisecond'));
        const timeDisplay = document.getElementById('time-display');
        expect(timeDisplay.innerHTML).toEqual('25:00');
        expect(app.onWork).toBeTruthy(); // 作業時間に切り替わっている
        expect(app.getHistory()).toEqual([endAt.add(100, 'millisecond').valueOf()]); // データの保存を確認   
    });
});

describe('stopTimer', () => {
    test('タイマーをリセットする', () => {
        document.body.innerHTML = template;
        const app = new App();
        const now = moment();
        const startOfToday = now.startOf('day');
        app.startButton.disabled = true;
        app.stopButton.disabled = false;
        app.isTimerStopped = false;
        app.startAt = startOfToday;
        app.endAt = moment(now).add(20, 'minutes');
        app.stopTimer();
        const timeDisplay = document.getElementById('time-display');
        expect(timeDisplay.innerHTML).toEqual('25:00');
        expect(app.onWork).toBeTruthy();
        expect(app.isTimerStopped).toBeTruthy();
        expect(app.startButton.disabled).not.toBeTruthy();
    });
});

describe('App.getHistory', () => {
    test('終了した作業インターバルの終了時間一覧を取得する', () => {
        const startOfToday = moment().startOf('day');
        const val1 = moment(startOfToday).subtract(5, 'days').add(30, 'minutes').valueOf();
        const val2 = moment(startOfToday).subtract(5, 'days').add(60, 'minutes').valueOf();
        const collection = [val1, val2];
        // intervalDataというkey名でデータを保存する ArrayをJSON形式に変換する
        localStorage.setItem('intervalData', JSON.stringify(collection));
        expect(App.getHistory()).toContain(val1);
        localStorage.clear();
    });
});

describe('saveIntervalData', () => {
    test('配列データを保存する', () => {
        document.body.innerHTML = template;
        const app = new App();
        const startOfToday = moment().startOf('day');
        // 作業終了時の時間のテストデータを作成
        const item = moment(startOfToday).subtract(5, 'days').add(60, 'minutes');
        app.saveIntervalData(item);
        expect(JSON.parse(localStorage.getItem('intervalData'))).toContain(item.valueOf());
        localStorage.clear();
    });
});

describe('displayCyclesToday', () => {
    test('当日の完了した作業サイクル数を表示する', () => {
        document.body.innerHTML = template;
        const app = new App();
        const startOfToday = moment().startOf('day');
        const time = moment(startOfToday).add(5, 'hours'); // 現在時刻を午前5時に設定
        const val1 = moment(startOfToday).add(30, 'minutes').valueOf(); // 午前0時に作業完了
        const val2 = moment(startOfToday).add(60, 'minutes').valueOf(); // 午前1時に作業完了
        const collection = [val1, val2];
        localStorage.setItem('intervalData', JSON.stringify(collection));
        app.displayCyclesToday(time);
        const countToday = document.getElementById('count-today');
        const percentToday = document.getElementById('percent-today');
        expect(countToday.innerHTML).toEqual('2回 / 4回');
        expect(percentToday.innerHTML).toEqual('目標を50%達成中です。');
        localStorage.clear();
    })
})

describe('displayHistory', () => {
    test('今日の開始時の7日前から今日の開始時までの回数を1日ずつ取得', () => {
        document.body.innerHTML = template;
        const startOfToday = moment().startOf('day');
        const SevenDaysAgo = moment(startOfToday).subtract(7, 'days');
        const val1 = moment(SevenDaysAgo).add(50, 'minutes').valueOf();
        const val2 = moment(SevenDaysAgo).add(80, 'minutes').valueOf();
        const val3 = moment(SevenDaysAgo).add(2, 'days').add('3', 'hours').valueOf();
        const val4 = moment(SevenDaysAgo)
          .add(3, 'days')
          .add('2', 'hours')
          .valueOf();
        const collection = [val1, val2, val3, val4];
        localStorage.setItem('intervalData', JSON.stringify(collection));
        const app = new App();
        const sevenDaysAgoTh = document.getElementsByTagName('th')[0];
        const fiveDaysAgoTh = document.getElementsByTagName('th')[2];
        const sevenDaysAgoTd = document.getElementsByTagName('td')[0];
        const fiveDaysAgoTd = document.getElementsByTagName('td')[2];
        expect(sevenDaysAgoTh.innerHTML).toEqual(SevenDaysAgo.format('MM月DD日'));
        expect(fiveDaysAgoTh.innerHTML).toEqual(SevenDaysAgo.add(2, 'days').format('MM月DD日'));
        expect(sevenDaysAgoTd.innerHTML).toEqual('2回<br>達成率50%');
        expect(fiveDaysAgoTd.innerHTML).toEqual('1回<br>達成率25%');
        expect(app.getHistory().length).toEqual(4);
    })
})

describe('removeOldHistory', () => {
    test('7日以前のデータを削除する', () => {
        const startOfToday = moment().startOf('day');
        const val1 = moment(startOfToday).subtract(8, 'days').add(30, 'minutes').valueOf(); // 8日前のデータを作成
        const val2 = moment(startOfToday).subtract(5, 'days').add(60, 'minutes').valueOf(); // 5日前のデータを作成
        const collection = [val1, val2];
        document.body.innerHTML = template;
        const app = new App();
        localStorage.setItem('intervalData', JSON.stringify(collection));
        app.removeOldHistory();
        expect(App.getHistory()).not.toContain(val1); // 8日前のデータは削除される
        expect(App.getHistory()).toContain(val2); // 5日前のデータは削除されず残る
        localStorage.clear();
    });
});