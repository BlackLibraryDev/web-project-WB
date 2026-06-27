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
            this.scene.resume('GameScene'); 
        } else {
            // 인벤토리 씬을 켜고 메인 게임을 일시정지시킵니다.
            this.scene.pause('GameScene');
            this.scene.launch('InventoryScene'); // launch는 병렬로 씬을 실행합니다.
        }
    }
}