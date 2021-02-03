import { Component, OnInit } from '@angular/core';
import { AssetElement } from 'src/app/models/models';
import { AssetService } from 'src/app/services/asset.service';

@Component({
  selector: 'sidebar-elements',
  templateUrl: './elements.component.html',
  styleUrls: ['./elements.component.scss'],
})
export class ElementsComponent implements OnInit {
  selector = '.scrollPanel';
  array = [];
  sum = 10;
  scrollDistance = 2;
  scrollUpDistance = 2;
  throttle = 300;
  direction = '';
  fonts;
  textPart: string = '';
  index: number;
  previousSelectedFontItemIndex: number = null;
  previousSelectedFontItemFamily: string = 'Alata';

  isLoading = false;
  assetElements: AssetElement[] = [];
  heights: number[] = [];

  constructor(public assetService: AssetService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.readElementByTag('');
  }

  readElementByTag(tag: string) {
    this.isLoading = true;
    this.assetService.readElementByTag(tag).subscribe((data) => {
      this.assetElements = data.map((e) => {
        return {
          uid: e.payload.doc.id,
          ...e.payload.doc.data(),
        } as AssetElement;
      });

      this.isLoading = false;
      this.appendItems(0, this.sum);
    });
  }

  onScrollDown(ev) {
    // add another 20 items
    const start = this.sum;
    this.sum += 10;
    this.appendItems(start, this.sum);

    this.direction = 'down';
  }

  appendItems(startIndex, endIndex) {
    this.addItems(startIndex, endIndex, 'push');
  }

  addItems(startIndex, endIndex, _method) {
    if (this.assetElements != []) {
      for (let i = startIndex; i < endIndex; ++i) {
        if (i >= this.assetElements.length) return;
        this.array[_method](this.assetElements[i]);
      }
    }
  }

  AddSVG() {}
}
