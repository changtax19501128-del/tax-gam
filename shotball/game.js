var ballMoving = false;
var currentQuestionIndex = 0;
var correctAnswers = 0;

//讀取csv函數
function parseCSV(data) {
    let rows = data.split("\n").map(row => row.trim()).filter(row => row.length > 0); // 分割 CSV 行並去除空行
    let result = [];

    for (let i = 1; i < rows.length; i++) { // 跳過標題列
        let columns = rows[i].split(",").map(col => col.replace(/"/g, "").trim()); // 去掉雙引號和空格
        result.push({
            question: columns[0],
            options: [columns[1], columns[2], columns[3]],
            correct: columns[4]
        });
    }
    return result;
}

// 定義 startGame 函數
function startGame(scene) {
    scene.overlay.setVisible(false);
    scene.window.setVisible(false);
    scene.review.setVisible(false);
    scene.reviewText.setVisible(false);
    scene.text.setVisible(false);
    scene.startButton.setVisible(false);
    scene.scale.resize(window.innerWidth, window.innerHeight); // 重新調整畫布大小
    // 創建籃框和籃球
    createBasketballScene(scene);
    // 記錄開始時間
    scene.startTime = scene.time.now;  
}

// 創建籃框和籃球的場景
function createBasketballScene(scene) {
    //顯示答對題數
    let corrSize = Math.min(scene.sys.game.config.width, scene.sys.game.config.height) * 0.05;  // 根據畫面大小調整字體大小
    correctAnswersText = scene.add.text(scene.sys.game.config.width / 7, scene.sys.game.config.height / 7, '答對題數: 0/5題', {
        //fontSize: '30px',
        fontSize: corrSize + 'px',
        fill: '#fff',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0.5);

    // 初始化三個籃框
    scene.hoops = [];
    const hoopPositions = [
        { x: scene.sys.game.config.width / 4.2, y: scene.sys.game.config.height / 2 },
        { x: scene.sys.game.config.width / 2.1, y: scene.sys.game.config.height / 2 },
        { x: (scene.sys.game.config.width / 4.2) * 3, y: scene.sys.game.config.height / 2 }
    ];
    const hoopVerticalOffset = scene.sys.game.config.height*0.02; // 設定一個固定的垂直偏移

    hoopPositions.forEach(position => {
        let hoop = scene.add.image(position.x, position.y- hoopVerticalOffset, 'hoop').setOrigin(0.5, 0.5);
        // hoop.setDisplaySize(200, 200); // 調整籃框大小
        let hoopSize = Math.min(scene.sys.game.config.width, scene.sys.game.config.height) * 0.2;
        hoop.setDisplaySize(hoopSize, hoopSize);
        //選項
        let ansSize = Math.min(scene.sys.game.config.width, scene.sys.game.config.height) * 0.035;
        hoop.answerText = scene.add.text(position.x, position.y- hoopSize * 0.3- hoopVerticalOffset, '', {
            //fontSize: '30px',
            fontSize: ansSize + 'px',
            fill: '#2F4F4F'
        }).setOrigin(0.5).setDepth(3)
        scene.physics.add.existing(hoop, true); // 將籃框添加到物理引擎中，但設為靜態物件
        hoop.setInteractive(); // 讓籃框可點擊
        hoop.on('pointerdown', function () {
            // 當籃框被點擊時，讓籃球進入該籃框
            throwBasketball(scene, hoop);
        });
        scene.hoops.push(hoop);
    });

    //設定題目出現型式
    let textSize = Math.min(scene.sys.game.config.width, scene.sys.game.config.height) * 0.06;
    questionText = scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height/4, '', {
        //fontSize: '45px',
        fontSize: textSize + 'px',
        fill: '#00008B',
        fontFamily: "Microsoft YaHei Bold", // 中文字體
        fontWeight: 'bold',
        stroke: '#FFFFFF', // 描边颜色
        // strokeThickness: 6 ,// 描边厚度
        // lineSpacing: 10 // 设置行间距，防止文字重叠
        strokeThickness: textSize * 0.1,
        lineSpacing: textSize * 0.2
    }).setOrigin(0.5, 0.5)
    
    questionText.setDepth(3); // 确保文字层级在最上方

    //讀取題目且隨機出題
    let csvData = scene.cache.text.get('questionsCSV'); // 取得 CSV 內容
    questions = parseCSV(csvData); // 解析 CSV 並存入 questions 陣列
    questions = Phaser.Utils.Array.Shuffle([...questions]); // 隨機出題
    loadNextQuestion(scene);


    // 創建籃球
    scene.basketball = scene.add.image(scene.sys.game.config.width / 2.1, scene.sys.game.config.height - 80, 'basketball').setOrigin(0.5, 0.5);
    //scene.basketball.setScale(0.6); // 調整籃球大小
    let ballSize = Math.min(scene.sys.game.config.width/2.1, scene.sys.game.config.height-80) * 0.5;
    scene.basketball.setDisplaySize(ballSize, ballSize);
    //scene.basketball.setScale(scene.sys.game.config.width / 1500);
    scene.physics.add.existing(scene.basketball, true); // 加入物理引擎，設為靜態物件（籃球初始狀態為靜止）

}

function loadNextQuestion(scene) {
    if (currentQuestionIndex >= questions.length) {
        return;
    }
    let currentQ = questions[currentQuestionIndex];
    questionText.setText(currentQ.question);
    let shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQ.options]);
    for (let i = 0; i < 3; i++) {
        scene.hoops[i].answer = shuffledOptions[i];
        scene.hoops[i].answerText.setText(shuffledOptions[i]);
    }
}
// 當籃框被點擊時，讓籃球進入該籃框
//let ballMoving = false; // 確保該變數在外層定義
let gameFinished = false;
function throwBasketball(scene, hoop) {
    if (gameFinished || ballMoving) return; // 遊戲結束或球在移動中時不允許投籃
    //ballMoving = true;
    const hoopPosition = hoop.getBounds();
    const targetX = hoopPosition.x + hoopPosition.width / 2;
    const targetY = hoopPosition.y + hoopPosition.height / 6;
    
    scene.tweens.add({
        targets: scene.basketball,
        x: targetX,
        y: targetY,
        scale: 0.2,
        ease: 'Quad.easeOut',
        duration: 500,
        onComplete: () => {
            let isCorrect = hoop.answer === questions[currentQuestionIndex].correct;
            if (isCorrect) {
                scene.sound.play('right');
                scene.tweens.add({
                    targets: scene.basketball,
                    y: targetY + 50,
                    alpha: 0,
                    ease: 'Linear',
                    duration: 500,
                    onComplete: () => {
                        correctAnswers++;
                        correctAnswersText.setText(`答對題數: ${correctAnswers}/5題`);
                        checkGameStatus(scene);  // 檢查遊戲是否結束
                    }
                });
            } else {
                // 籃球答錯時彈開
                let bounceX = targetX + (Math.random() > 0.5 ? 50 : -50);
                let bounceY = targetY - Math.random() * 100 - 50;
                scene.sound.play('miss');
                scene.tweens.add({
                    targets: scene.basketball,
                    x: bounceX,
                    y: bounceY,
                    ease: 'Bounce.easeOut',
                    duration: 500,
                    onComplete: () => {
                         //checkGameStatus(scene); // 檢查遊戲是否結束
                         showLoseScreen(scene)

                    }
                });
            }
        }
    });
}

// **新增 `checkGameStatus()` 方法**
function checkGameStatus(scene) {
    currentQuestionIndex++;  // 無論答對或答錯，都讓 index +1
    if (currentQuestionIndex >= questions.length) {
        gameFinished = true;
        if (correctAnswers === questions.length) {
            showSuccessScreen(scene);  // **全答對才顯示成功畫面**
        }
        // else {
        //     showLoseScreen(scene);  // **有錯就顯示失敗畫面**
        // }
    } else {
        resetBall(scene);
        loadNextQuestion(scene);
    }
}






// 重置籃球的位置
function resetBall(scene) {
    scene.basketball.setPosition(scene.sys.game.config.width / 2.1, scene.sys.game.config.height - 80);
    let ballSize = Math.min(scene.sys.game.config.width/2.1, scene.sys.game.config.height-80) * 0.5;
    scene.basketball.setDisplaySize(ballSize, ballSize);
    //scene.basketball.setScale(scene.sys.game.config.width / 1500);
    //scene.basketball.setScale(0.5); // 恢复原始大小
    scene.basketball.setAlpha(1); // 重置透明度
    scene.basketball.setDepth(1); // 确保篮筐在球的下面
    ballMoving = false; // 允许再次点击
}


// **過關的提示框**
function showSuccessScreen(scene) {
    scene.graphics1 = scene.add.graphics();
    scene.graphics1.fillStyle(0x4169E1, 1);
    scene.graphics1.fillRect(scene.sys.game.config.width / 2 - 250, scene.sys.game.config.height / 2 - 175, 500, 350);
    scene.graphics1.setDepth(3);
    let successText = scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2 - 130, '恭喜過關!(請截圖)', {
        fontSize: '42px',
        fill: '#fff',
        align: 'center',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    successText.setDepth(4);
    let elapsedTime = (scene.time.now - scene.startTime) / 1000; // 轉換為秒
    let passtime = scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2 - 80, '過關時間:'+elapsedTime.toFixed(0)+'秒', {
        fontSize: '45px',
        fill: '#fff',
        align: 'center',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    passtime.setDepth(4);
    // 在過關框中添加 Google表單
    let button1 = scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2 , 'Google表單', {
        fontSize: '50px',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#FFDAB9', // 按钮背景色
        padding: { x: 20, y: 10 }, // 按钮内边距
    }).setOrigin(0.5);
    button1.setDepth(5);
    button1.setStroke('#000000', 3);

    // 添加按钮的交互事件
    button1.setInteractive();
    button1.on('pointerdown', () => {
        window.open('https://forms.gle/1RuwvcsDzQkRX7298', '_blank');
    });

    // 鼠标悬停效果
    button1.on('pointerover', function () {
        button1.setStyle({ fill: '#f39c12' }); // 鼠标悬停时按钮变色
    });

    button1.on('pointerout', function () {
        button1.setStyle({ fill: '#fff' }); // 鼠标离开时按钮恢复原色
    });

    //再挑戰一次
    let button2 = scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2 + 100, '再挑戰一次', {
        fontSize: '50px',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#FFDAB9',
        padding: { x: 20, y: 10 },
    }).setOrigin(0.5);
    button2.setDepth(5);
    button2.setStroke('#000000', 3);

    button2.setInteractive();
    button2.on('pointerdown', () => {
        restartGame1(scene,successText,button1, button2);
    });

    button2.on('pointerover', function () {
        button2.setStyle({ fill: '#f39c12' });
    });

    button2.on('pointerout', function () {
        button2.setStyle({ fill: '#fff' });
    });

    for (let i = 0; i < 3; i++) {
        scene.hoops[i].setVisible(false);
        scene.hoops[i].answerText.destroy();
    }
    scene.basketball.setVisible(false);
    questionText.destroy();
    scene.sound.play('allright');
}

// **结束时的提示框**
function showLoseScreen(scene) {
    scene.graphics1 = scene.add.graphics();
    scene.graphics1.fillStyle(0x4169E1, 1);
    scene.graphics1.fillRect(scene.sys.game.config.width / 2 - 250, scene.sys.game.config.height / 2 - 200, 500, 350);
    scene.graphics1.setDepth(3);

    let loseText = scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2 - 120, '加油再努力！', {
        fontSize: '50px',
        fill: '#fff',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    loseText.setDepth(4);
    // let aerror = questions.length - correctAnswers;
    let aerror = 1;
    let loseText1 = scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2 - 20, '答錯題數:' + aerror + ' 題', {
        fontSize: '50px',
        fill: '#fff',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    loseText1.setDepth(4);

    let button1 = scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2 + 80, '再挑戰一次', {
        fontSize: '50px',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#FFDAB9',
        padding: { x: 20, y: 10 },
    }).setOrigin(0.5);
    button1.setDepth(5);
    button1.setStroke('#000000', 3);

    button1.setInteractive();
    button1.on('pointerdown', () => {
        restartGame(scene, loseText, loseText1, button1);
    });

    button1.on('pointerover', function () {
        button1.setStyle({ fill: '#f39c12' });
    });

    button1.on('pointerout', function () {
        button1.setStyle({ fill: '#fff' });
    });

    for (let i = 0; i < 3; i++) {
        scene.hoops[i].setVisible(false);
        scene.hoops[i].answerText.destroy();
    }
    scene.basketball.setVisible(false);

    questionText.destroy();

}


function restartGame(scene, loseText, loseText1, button1) {
    // currentQuestionIndex = 0;
    // correctAnswers = 0;
    //             graphics.destroy();
    scene.graphics1.clear();
    loseText.destroy();
    loseText1.destroy();
    button1.destroy();
    // 重置遊戲狀態
    correctAnswers = 0;
    currentQuestionIndex = 0;
    gameFinished = false;  // 重置游戏结束状态

    // 重新加載問題
    let csvData = scene.cache.text.get('questionsCSV'); // 取得 CSV 內容
    questions = parseCSV(csvData); // 解析 CSV 並存入 questions 陣列
    questions = Phaser.Utils.Array.Shuffle([...questions]); // 隨機出題
    scene.scene.restart();
}

//succeescren restartGame
function restartGame1(scene, successText, button1,button2) {
    scene.graphics1.clear();
    successText.destroy();
    button1.destroy();
    button2.destroy();
    // 重置遊戲狀態
    correctAnswers = 0;
    currentQuestionIndex = 0;
    gameFinished = false;  // 重置游戏结束状态
    // 重新加載問題
    let csvData = scene.cache.text.get('questionsCSV'); // 取得 CSV 內容
    questions = parseCSV(csvData); // 解析 CSV 並存入 questions 陣列
    questions = Phaser.Utils.Array.Shuffle([...questions]); // 隨機出題
    scene.scene.restart();
}

// 定義遊戲配置
var config = {
    type: Phaser.AUTO,
    parent:'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade', // 啟用物理引擎
        arcade: {
            gravity: { y: 0 }, // 不加重力
            debug: false // 這裡可以開啟debug來檢查物理效果
        }
    },
    scene: {
        preload: function () {
            this.load.image('background', 'assert/bnew.png');
            this.load.image('hoop', 'assert/hoopnew.png');
            this.load.image('basketball', 'assert/basketball.png');
            this.load.text('questionsCSV', 'question/QA1.csv');
            this.load.image('review', 'assert/review.png');
            this.load.audio('right', 'assert/audio/right.mp3');  // 答對音效
            this.load.audio('miss', 'assert/audio/miss.mp3');      // 答錯音效
            this.load.audio('allright', 'assert/audio/allright.mp3');
        },

        create: function () {
            // 初始化場景
            let scene = this;
            this.background = this.add.image(0, 0, 'background').setOrigin(0, 0);
            this.background.setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

            // 遮罩和視窗
            this.overlay = this.add.graphics();
            this.overlay.fillStyle(0x000000, 0.5);
            this.overlay.fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height);

            this.window = this.add.graphics();
            this.window.fillStyle(0x4169E1, 1);
            this.window.fillRect(this.sys.game.config.width / 2 - 250, this.sys.game.config.height / 2 - 200, 500, 400);

            this.text = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 - 90, '挑戰彰稅小籃手！\n答對所有題目！\n截圖填表單！', {
                font: '40px Arial',
                fill: '#fff',
                align: 'center'
            }).setOrigin(0.5);

            // "遊戲開始" 按鈕
            this.startButton = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 40, 'Ready GO', {
                fontSize: '45px',
                color: '#fff',
                fontFamily: 'Arial, sans-serif',
                backgroundColor: '#FFDAB9',
                padding: { x: 10, y: 5 },
            }).setOrigin(0.5)
                .setDepth(4)
                .setStroke('#000000', 3)
                .setInteractive();

            this.startButton.on('pointerdown', function () {
                startGame(scene); // 使用已經初始化的 scene
            }, this);

            this.startButton.on('pointerover', () => {
                this.startButton.setStyle({ fill: '#f39c12' });
            });

            this.startButton.on('pointerout', () => {
                this.startButton.setStyle({ fill: '#fff' });
            });

            // 創建復習按鈕
            this.review = this.add.image(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 135, 'review')
                .setInteractive()
                .setDepth(5)
                .setScale(0.11)
                .on('pointerdown', () => {
                    window.open('https://sites.google.com/view/changtax-children/%E9%A6%96%E9%A0%81', '_blank');
                });

            // 滑鼠懸停效果
            this.review.on('pointerover', () => {
                this.review.setScale(0.15);
            });
            this.review.on('pointerout', () => {
                this.review.setScale(0.11);
            });

            this.reviewText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 135, '復習請按我', {
                fontSize: '20px',
                fill: '#fff',
                fontFamily: 'Arial, sans-serif'
            }).setOrigin(0.5)
                .setDepth(5)
                .setInteractive();
            this.reviewText.on('pointerover', () => {
                this.reviewText.setStyle({ fill: '#f39c12' });
            });
            this.reviewText.on('pointerout', () => {
                this.reviewText.setStyle({ fill: '#fff' });
            });

            this.tweens.add({
                targets: this.reviewText,
                scale: { from: 1, to: 1.5 },
                alpha: { from: 1, to: 0.8 },
                yoyo: true,
                repeat: -1,
                duration: 800,
                ease: 'Sine.easeInOut'
            });


            // 監聽螢幕變化，動態更新 UI
                this.scale.on('resize', (gameSize) => {
                this.background.setDisplaySize(gameSize.width, gameSize.height);
                this.overlay.clear();
                this.overlay.fillStyle(0x000000, 0.5);
                this.overlay.fillRect(0, 0, gameSize.width, gameSize.height);
                this.window.clear();
                this.window.fillStyle(0x4169E1, 1);
                this.window.fillRect(gameSize.width / 2 - 250, gameSize.height / 2 - 200, 500, 400);
            });

        },

        update: function () {
            if (ballMoving) return;

        }
    }
};

new Phaser.Game(config);