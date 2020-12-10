import { Injectable } from '@angular/core';

import Moveable, {
  OnDragStart,
  OnDrag,
  OnDragGroupStart,
  OnDragGroup,
  OnRotate,
  OnResizeStart,
  OnResize,
  OnResizeGroupStart,
  OnResizeGroup,
  OnRotateStart,
  OnRotateGroupStart,
  OnRotateGroup,
  OnClip,
} from 'moveable';
import Selecto, { OnKeyEvent, OnScroll, OnSelect, OnSelectEnd } from 'selecto';
import { DesignService } from './design.service';
import { Item } from '../models/models';
import { ItemType } from '../models/enums';

@Injectable({
  providedIn: 'root',
})
export class MoveableService {
  selecto: Selecto;
  moveable: Moveable;

  constructor(private ds: DesignService) {}

  init() {
    let container: HTMLElement = document.querySelector('#selecto-container');
    let scroller: HTMLElement = document.querySelector('#selecto-area');

    this.initSelecto(container, scroller);
  }

  initSelecto(container: HTMLElement, scroller: HTMLElement) {
    let targets: (HTMLElement | SVGElement)[] = [];

    const selecto = new Selecto({
      // The container to add a selection element
      container: container,
      dragContainer: scroller,
      // Container to bound the selection area. If false, do not bound. If true, it is the container of selecto. (default: false)
      boundContainer: true,
      // Targets to select. You can register a queryselector or an Element.
      selectableTargets: ['.target'],
      // Whether to select by click (default: true)
      selectByClick: true,
      // Whether to select from the target inside (default: true)
      selectFromInside: false,
      // After the select, whether to select the next target with the selected target (deselected if the target is selected again).
      continueSelect: false,
      // Determines which key to continue selecting the next target via keydown and keyup.
      toggleContinueSelect: 'shift',
      // The container for keydown and keyup events
      keyContainer: container,
      // The rate at which the target overlaps the drag area to be selected. (default: 100)
      hitRate: 0,
      scrollOptions: {
        container: scroller,
        throttleTime: 30,
        threshold: 0,
      },
    });

    selecto.on('scroll', (e: OnScroll) => {
      scroller.scrollBy(e.direction[0] * 10, e.direction[1] * 10);
    });

    selecto.on('select', (e: OnSelect) => {
      e.added.forEach((el) => {
        let { item } = this.getItem(el);
        if (item) {
          item.selected = true;
        }
      });
      e.removed.forEach((el) => {
        let { item } = this.getItem(el);
        if (item) {
          item.selected = false;
        }
      });
    });

    selecto.on('selectEnd', (e: OnSelectEnd) => {
      targets = e.selected;

      this.makeMoveable(targets);

      console.log(this.moveable);
      if (e.isDragStart) {
        e.inputEvent.preventDefault();
        setTimeout(() => {
          this.moveable?.dragStart(e.inputEvent);
        }, 10);
      }
    });

    selecto.on('dragStart', (e) => {
      const target = e.inputEvent.target;
      if (
        (this.moveable && this.moveable.isMoveableElement(target)) ||
        targets.some((t) => t === target || t.contains(target))
      ) {
        e.stop();
      }
    });

    this.selecto = selecto;
  }

  makeMoveable(targets: (HTMLElement | SVGElement)[]) {
    if (this.moveable) this.moveable.setState({ target: [] });

    if (targets.length > 1) {
      this.moveable = this.makeMoveableGroup(targets);
    } else if (targets.length === 1) {
      let { item } = this.getItem(targets[0]);
      if (item.type === ItemType.image)
        this.moveable = this.makeMoveableImage(targets[0]);
      else if (item.type === ItemType.text)
        this.moveable = this.makeMoveableText(targets[0]);
    } else {
      this.moveable = null;
    }
  }

  makeMoveableGroup(targets: (HTMLElement | SVGElement)[]) {
    let thePageId = -1;
    targets.forEach((target) => {
      let { item, pageId, itemId } = this.getItem(target);
      if (thePageId === -1) thePageId = pageId;
      else if (thePageId > pageId) thePageId = pageId;
    });

    targets = targets.filter((target) => {
      let { item, pageId, itemId } = this.getItem(target);
      return pageId === thePageId;
    });

    let pageContainer: HTMLElement | SVGElement = document.querySelector(
      '#page-' + thePageId
    );

    const moveable = new Moveable(pageContainer, {
      // target: elements[0],
      // If the container is null, the position is fixed. (default: parentElement(document.body))
      container: pageContainer,
      target: targets,
      draggable: true,
      resizable: true,
      rotatable: true,
      defaultGroupRotate: 0,
      defaultGroupOrigin: '50% 50%',
      originDraggable: true,
      originRelative: true,

      snapThreshold: 5,
      // scalable: true,
      origin: true,
      keepRatio: true,
      // Resize, Scale Events at edges.
      edge: false,
      throttleDrag: 0,
      throttleResize: 0,
      throttleScale: 0,
      throttleRotate: 0,
      rotationPosition: 'bottom',
    });

    /* draggable */
    moveable
      .on('dragStart', (e: OnDragStart) => {
        let { item } = this.getItem(e.target);
        e.set([item.x, item.y]);
      })
      .on('drag', (e: OnDrag) => {
        // if (e.inputEvent.ctrlKey || e.inputEvent.metaKey) {
        let { item } = this.getItem(e.target);
        item.x = e.beforeTranslate[0];
        item.y = e.beforeTranslate[1];

        e.target.style.transform = this.strTransform(item);
        // }
      })
      .on('dragGroupStart', (ev: OnDragGroupStart) => {
        ev.events.forEach((e) => {
          moveable.emit('dragStart', e);
        });
      })
      .on('dragGroup', (ev: OnDragGroup) => {
        ev.events.forEach((e) => {
          moveable.emit('drag', e);
        });
      });

    /* resizable */
    moveable
      .on('resizeStart', (e: OnResizeStart) => {
        let { item } = this.getItem(e.target);
        e.setOrigin(['%', '%']);
        e.dragStart && e.dragStart.set([item.x, item.y]);
      })
      .on('resize', (e: OnResize) => {
        let { item } = this.getItem(e.target);
        item.x = e.drag.beforeTranslate[0];
        item.y = e.drag.beforeTranslate[1];
        item.w = e.width;
        item.h = e.height;

        e.target.style.transform = this.strTransform(item);
        e.target.style.width = `${e.width}px`;
        e.target.style.height = `${e.height}px`;
      })
      .on('resizeGroupStart', (ev: OnResizeGroupStart) => {
        ev.events.forEach((e: OnResizeStart) => {
          moveable.emit('resizeStart', e);
        });
      })
      .on('resizeGroup', (ev: OnResizeGroup) => {
        ev.events.forEach((e: OnResize) => {
          moveable.emit('resize', e);
        });
      });

    /* rotatable */
    moveable
      .on('rotateStart', (e: OnRotateStart) => {
        let { item } = this.getItem(e.target);
        e.set(item.rotate);
        e.dragStart && e.dragStart.set([item.x, item.y]);
      })
      .on('rotate', (e: OnRotate) => {
        let { item } = this.getItem(e.target);
        item.x = e.drag.beforeTranslate[0];
        item.y = e.drag.beforeTranslate[1];
        item.rotate = e.rotate;

        e.target.style.transform = this.strTransform(item);
      })
      .on('rotateGroupStart', (ev: OnRotateGroupStart) => {
        ev.events.forEach((e: OnRotateStart) => {
          moveable.emit('rotateStart', e);
        });
      })
      .on('rotateGroup', (ev: OnRotateGroup) => {
        ev.events.forEach((e: OnRotate) => {
          moveable.emit('rotate', e);
        });
      });

    return moveable;
  }

  makeMoveableImage(target: HTMLElement | SVGElement) {
    let { pageId: thePageId } = this.getItem(target);

    let pageContainer: HTMLElement | SVGElement = document.querySelector(
      '#page-' + thePageId
    );

    const moveable = new Moveable(pageContainer, {
      // target: elements[0],
      // If the container is null, the position is fixed. (default: parentElement(document.body))
      container: pageContainer,
      target: [target],
      draggable: true,
      resizable: true,
      rotatable: true,
      originDraggable: true,
      originRelative: true,

      snapThreshold: 5,
      // scalable: true,
      origin: true,
      keepRatio: true,
      // Resize, Scale Events at edges.
      edge: false,
      throttleDrag: 0,
      throttleResize: 0,
      throttleScale: 0,
      throttleRotate: 0,
      rotationPosition: 'bottom',
    });

    /* draggable */
    moveable
      .on('dragStart', (e: OnDragStart) => {
        let { item } = this.getItem(e.target);
        e.set([item.x, item.y]);
      })
      .on('drag', (e: OnDrag) => {
        // if (e.inputEvent.ctrlKey || e.inputEvent.metaKey) {
        let { item } = this.getItem(e.target);
        item.x = e.beforeTranslate[0];
        item.y = e.beforeTranslate[1];

        e.target.style.transform = this.strTransform(item);
        // }
      });

    /* resizable */
    moveable
      .on('resizeStart', (e: OnResizeStart) => {
        let { item } = this.getItem(e.target);
        e.setOrigin(['%', '%']);
        e.dragStart && e.dragStart.set([item.x, item.y]);
      })
      .on('resize', (e: OnResize) => {
        let { item } = this.getItem(e.target);
        item.x = e.drag.beforeTranslate[0];
        item.y = e.drag.beforeTranslate[1];
        item.w = e.width;
        item.h = e.height;

        e.target.style.transform = this.strTransform(item);
        e.target.style.width = `${e.width}px`;
        e.target.style.height = `${e.height}px`;
      });

    /* rotatable */
    moveable
      .on('rotateStart', (e: OnRotateStart) => {
        let { item } = this.getItem(e.target);
        e.set(item.rotate);
        e.dragStart && e.dragStart.set([item.x, item.y]);
      })
      .on('rotate', (e: OnRotate) => {
        let { item } = this.getItem(e.target);
        item.x = e.drag.beforeTranslate[0];
        item.y = e.drag.beforeTranslate[1];
        item.rotate = e.rotate;

        e.target.style.transform = this.strTransform(item);
      });

    return moveable;
  }

  makeMoveableText(target: HTMLElement | SVGElement) {
    return null;
  }

  getItem(
    target: HTMLElement | SVGElement
  ): { item: Item; pageId: number; itemId: number } {
    const pageId = Number(target.getAttribute('pageId'));
    const itemId = Number(target.getAttribute('itemId'));
    if (
      pageId < this.ds.theDesign.pages.length &&
      itemId < this.ds.theDesign.pages[pageId].items.length
    ) {
      let item = this.ds.theDesign.pages[pageId].items[itemId];
      return { item, pageId, itemId };
    }
    return null;
  }

  strTransform(item: Item): string {
    return `translate(${item.x}px, ${item.y}px) rotate(${item.rotate}deg)`;
  }
}
