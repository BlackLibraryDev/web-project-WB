import { Buttons } from '../utils/Buttons.js';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        console.log("UI 씬 시작됨");

        // 화면 우측 상단 좌표 계산
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        // 게임 씬의 참조를 가져옵니다.
        const gameScene = this.scene.get('GameScene');

        // 🌟 조이스틱을 게임 씬이 아닌 'UIScene' 내부 레이어에 생성합니다.
        
        this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
            x: 160, y: height-160, radius: 120,
            base: this.add.circle(0, 0, 90, 0x888888, 0.5),
            thumb: this.add.circle(0, 0, 50, 0xcccccc, 0.8),
            dir: '8dir', forceMin: 16, enable: true
        })
        // 🌟 조이스틱 신호를 GameScene의 플레이어에게 전달하는 리스너 등록
        this.joyStick.on('update', () => {
            if (gameScene && gameScene.player) {
                // GameScene에 만들어 둔 조이스틱 입력 처리 함수 호출
                gameScene.handleJoystickInput(this.joyStick);
            }
        });

        // 1. 버튼을 배치할 좌표 설정 (화면 우하단)
        const buttonX = this.cameras.main.width - 140;
        const buttonY = this.cameras.main.height - 140;
        const buttonRadius = 64;

        // 2. 버튼 배경 원형 그리기 (약간 투명한 붉은 계열)
        const btnBase = this.add.circle(buttonX, buttonY, buttonRadius, 0xdd4b39, 0.7);
        
        // 3. 버튼 위의 검 이모지 텍스트 올리기
        const btnIcon = this.add.text(buttonX, buttonY, '⚔️', { font: '48px Arial' }).setOrigin(0.5);

        // 4. 배경 원형 객체에 터치(마우스 클릭) 입력 활성화
        btnBase.setInteractive(new Phaser.Geom.Circle(buttonRadius, buttonRadius, buttonRadius), Phaser.Geom.Circle.Contains);

        // 5. ─── 👆 버튼 터치 이벤트 리스너 등록 ───

        // [이벤트 A] 버튼을 누르는 순간 (Pointer Down)
        btnBase.on('pointerdown', () => {
            // 시각적 피드백: 버튼을 어둡고 작게 만들어 누른 느낌을 줍니다.
            btnBase.setFillStyle(0x992211, 0.9);
            btnBase.setScale(0.95);
            btnIcon.setScale(0.95);

            // ⚔️ 실제 플레이어의 공격 함수 실행!
            // (UIScene 기준 코드입니다. 단일 씬이라면 this.player.attack(60); 으로 변경)
            const gameScene = this.scene.get('GameScene');
            if (gameScene && gameScene.player) {
                gameScene.player.attack(); //
            }
        });

        // [이벤트 B] 버튼에서 손을 떼거나 마우스가 벗어났을 때 (Pointer Up / Out)
        const releaseButton = () => {
            // 원래 밝기와 크기로 복구
            btnBase.setFillStyle(0xdd4b39, 0.7);
            btnBase.setScale(1);
            btnIcon.setScale(1);
        };

        btnBase.on('pointerup', releaseButton);
        btnBase.on('pointerout', releaseButton);

        // 🎒 1. 인벤토리 토글 버튼 생성
        Buttons.createIconButton(
            this,  width - 80, 80, '🎒', 
            () => {
                this.toggleInventory();
            }
        );

        // ⚙️ 2. 설정 버튼 생성 (가방 버튼 아래 배치)
        Buttons.createSimpleButton(
            this, 80, 80,  '⚙️ 설정', 
            () => {
                console.log("설정창 열기 콜백 실행");
                // 정지 기능이나 설정창 팝업 띄우기 로직...
            }
        );
    }

    toggleInventory() {
        // 이미 인벤토리 씬이 켜져있다면 닫고, 꺼져있다면 켭니다.
        if (this.scene.isActive('InventoryScene')) {
            this.scene.stop('InventoryScene');
            // 메인 게임 씬이 일시정지 상태였다면 다시 재개(Resume)
            //this.scene.resume('GameScene'); 
        } else {
            // 인벤토리 씬을 켜고 메인 게임을 일시정지시킵니다.
            //this.scene.pause('GameScene');
            this.scene.launch('InventoryScene'); // launch는 병렬로 씬을 실행합니다.
        }
    }
}