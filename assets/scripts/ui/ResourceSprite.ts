import { _decorator, Component, Sprite, SpriteFrame, resources } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ResourceSprite')
export class ResourceSprite extends Component {
  @property
  spriteFramePath = '';

  @property(Sprite)
  targetSprite: Sprite | null = null;

  start(): void {
    if (this.spriteFramePath.length > 0) {
      this.load(this.spriteFramePath);
    }
  }

  load(path: string): void {
    this.spriteFramePath = path;
    const target = this.targetSprite ?? this.getComponent(Sprite);
    if (!target) {
      return;
    }

    resources.load(path, SpriteFrame, (error, spriteFrame) => {
      if (error) {
        console.warn(`ResourceSprite failed to load: ${path}`, error);
        return;
      }
      target.spriteFrame = spriteFrame;
    });
  }
}
