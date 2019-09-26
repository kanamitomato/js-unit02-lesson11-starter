import './assets/scss/styles.scss';
import moment from 'moment';

const SECOND = 1000; // 1000ミリ秒
const MINUTE = 60 * SECOND; // 1分のミリ秒数
const DAY = 24 * 60 * MINUTE; // 1日のミリ秒数


class App {
  constructor() {
    this.workLength = 25;
    this.breakLength = 5;
    this.isTimerStopped = true;
    this.onWork = true;
    this.startTimer = this.startTimer.bind(this);
    this.stopTimer = this.stopTimer.bind(this);
    this.updateTimer = this.updateTimer.bind(this);
    this.resetValues = this.resetValues.bind(this);
    this.displayTime = this.displayTime.bind(this);
    this.getHistory = App.getHistory.bind(this);
    this.saveIntervalData = this.saveIntervalData.bind(this);
    this.displayCyclesToday = this.displayCyclesToday.bind(this);
    this.startAt = null; // カウントダウン開始時の時間
    this.endAt = null; // カウントダウン終了時の時間
    this.resetValues();
    this.getElements();
    this.toggleEvents();
    this.displayTime();
    this.displayCyclesToday();
  }

  getElements() {
    this.timeDisplay = document.getElementById('time-display');
    this.countOfTodayDisplay = document.getElementById('count-today');
    this.percentOfTodayDisplay = document.getElementById('percent-today');
    this.startButton = document.getElementById('start-button');
    this.stopButton = document.getElementById('stop-button');
  }

  static getHistory() {
    const items = localStorage.getItem('intervalData');
    let collection = [];
    // localStrageはArrayを直接保存できないのでJSON形式で保存する
    // 取り出すときはJSON.perseでarrayに戻す
    if (items) collection = JSON.parse(items);
    return collection;
  }

  resetValues() {
    this.workLength = 25;
    this.breakLength = 5;
    this.startAt = null;
    this.endAt = null;
    this.isTimerStopped = true;
    this.onWork = true;
  }

  saveIntervalData(momentItem) {
    const collection = this.getHistory(); // すでに保存しているデータの取得
    collection.push(momentItem.valueOf()); // 新しいデータを追加する
    // JSON形式で再度保存する
    localStorage.setItem('intervalData', JSON.stringify(collection));
  }

  // displayTimeを呼び出して時間表示を更新する
  updateTimer(time = moment()) {
    const rest = this.endAt.diff(time); // 残り時間を取得
    if (rest <= 0) {
      if (this.onWork) {
        this.saveIntervalData(time); // 作業時からの切り替わり時のみsaveIntervalを呼び出す
      }
      this.onWork = !this.onWork;
      this.startAt = time;
      this.endAt = this.onWork ? moment(time).add(this.workLength, 'minutes')
        : moment(time).add(this.breakLength, 'minutes');
    }
    this.displayTime(time);
  }

  displayTime(time = moment()) {
    // 残りの分数と秒数を数えるための変数
    let mins;
    let secs;
    // タイマーが止まっているときは、常に作業時間の長さを表示
    if (this.isTimerStopped) {
      mins = this.workLength;
      secs = 0;
    } else {
      const diff = this.endAt.diff(time); // 与えられた時間（通常現在時刻）と終了時刻との差を取得。差はミリ秒で得られる
      mins = Math.floor(diff / MINUTE); // 分数を得て小数点以下の切り捨てを行う
      secs = Math.floor((diff % MINUTE) / 1000); // 秒数を得て小数点以下の切り捨てを行う
    }
    // 数値を文字に変換
    const minsString = mins.toString();
    let secsString = secs.toString();
    // 秒数が一桁の時は0を加えて2桁表示にする
    if (secs < 10) {
      secsString = `0${secsString}`;
    }
    // 最後に分数と秒数を表示
    this.timeDisplay.innerHTML = `${minsString}:${secsString}`;
  }

  toggleEvents() {
    this.startButton.addEventListener('click', this.startTimer);
    this.stopButton.addEventListener('click', this.stopTimer); // stopTimerファンクションを呼び出す
  }

  stopTimer(e = null) {
    if (e)e.preventDefault();
    this.resetValues();
    this.startButton.disabled = false;
    this.stopButton.disabled = true;
    window.clearInterval(this.timerUpdater);
    this.timerUpdater = null;
    this.displayTime();
  }

  startTimer(e = null, time = moment()) {
    if (e) e.preventDefault();
    this.startButton.disabled = true;
    this.stopButton.disabled = false;
    this.isTimerStopped = false;
    this.startAt = time;
    const startAtClone = moment(this.startAt);
    this.endAt = startAtClone.add(this.workLength, 'minutes');
    this.timerUpdater = window.setInterval(this.updateTimer, 500); // タイムラグがあるので、0.5秒ごとにアップデートする
    this.displayTime();
  }

  displayCyclesToday(time = moment()) {
    const collection = this.getHistory();
    const startOfToday = time.startOf('day');
    // 今日の始まりより後の時間のデータのみを取得してfilteritemsに格納する
    const filterItems = collection.filter(item => (
      parseInt(item, 10) >= startOfToday.valueOf()
    ));
    const count = filterItems.length;
    const percent = count / 4 * 100;
    this.countOfTodayDisplay.innerHTML = `${count.toString()}回 / 4回`;
    this.percentOfTodayDisplay.innerHTML = `目標を${percent}%達成中です。`;
  }

  // stopTimer() {}
}

// ロード時にAppクラスを実行する
window.addEventListener('load', () => new App());

export default App;
