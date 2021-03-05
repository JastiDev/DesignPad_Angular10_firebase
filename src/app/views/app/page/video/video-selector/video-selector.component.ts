import { Component, Input, OnInit } from '@angular/core';
import { DesignService } from 'src/app/services/design.service';
import { MoveableService } from 'src/app/services/moveable.service';
import { Item } from 'src/app/models/models';

import * as CSS from 'csstype';

@Component({
  selector: 'app-video-selector',
  templateUrl: './video-selector.component.html',
  styleUrls: ['./video-selector.component.scss'],
})
export class VideoSelectorComponent implements OnInit {
  @Input('item') item;

  constructor(public ds: DesignService, public moveableService: MoveableService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.moveableService.setSelectable(this.item.itemId, this.item.pageId, '#VideoSelector-');
  }

  styleItemPosition(item: Item): CSS.Properties {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: item.w + 'px',
      height: item.h + 'px',
      transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate}deg)`,
      WebkitTransform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate}deg)`,
      zIndex: item.zIndex,
    };
  }
}