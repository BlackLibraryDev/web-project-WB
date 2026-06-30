
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

        

        Buttons.createRoundButton(this, width-260, height-160, 96,'⚔️',
            () => {
                const gameScene = this.scene.get('GameScene');
                if (gameScene && gameScene.player) {
                    gameScene.player.attack(); //
                }
            }
        );
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
            const _scene = this.scene.get('InventoryScene');
        if (_scene) {
            _scene.closeInventory();
        }
            // 메인 게임 씬이 일시정지 상태였다면 다시 재개(Resume)
            //this.scene.resume('GameScene'); 
        } else {
            // 인벤토리 씬을 켜고 메인 게임을 일시정지시킵니다.
            //this.scene.pause('GameScene');
            this.scene.launch('InventoryScene'); // launch는 병렬로 씬을 실행합니다.
        }
    }
}