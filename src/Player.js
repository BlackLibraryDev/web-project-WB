// Phaser가 전역(window.Phaser)에 등록되어 있다면 바로 사용 가능합니다.
export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        // Super를 호출하여 Phaser Sprite의 기본 생성자를 실행해야 합니다.
        super(scene, x, y, texture);


        this.inventory = []; // 플레이어의 인벤토리 초기화

        

        this.scene.registry.set('playerInventory', this.inventory);
        // 씬에 객체 추가 및 물리 엔진 등록
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 플레이어의 크기와 위치를 조정할 수 있습니다.
        this.setScale(0.25); // 크기 조정 (필요에 따라 변경)
        this.setOrigin(0.5, 0.5); // 중심점을 스프라이트의 중앙으로 설정
        // 히트박스 설정 등 초기화
        this.setCollideWorldBounds(true);
    }
    addItem(item) {
        this.inventory.push(item);
        this.scene.registry.set('playerInventory', this.inventory);
    }

    removeItem(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
        }
        this.scene.registry.set('playerInventory', this.inventory);
    }

    hasItem(item) {
        return this.inventory.includes(item);
    }

    // 이동 로직을 이 안으로 캡슐화할 수 있습니다.
    /*
    update(isoX, isoY, speed) {
        this.setVelocity(isoX * speed, isoY * speed);

    // 이동 로직을 이 안으로 캡슐화할 수 있습니다.
    /*
    update(isoX, isoY, speed) {
        this.setVelocity(isoX * speed, isoY * speed);

        if (isoX < 0) this.setFlipX(false);
        else if (isoX > 0) this.setFlipX(true);
    }*/
}