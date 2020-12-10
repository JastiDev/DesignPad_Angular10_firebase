import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DesignService } from 'src/app/services/design.service';
import { Colors } from 'src/app/constants/colors.service';
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';
import { MoveableService } from 'src/app/services/moveable.service';

declare var ResizeObserver;

@Component({
  selector: 'app-design-panel',
  templateUrl: './design-panel.component.html',
  styleUrls: ['./design-panel.component.scss'],
  providers: [
    {
      provide: BsDropdownConfig,
      useValue: { isAnimated: true, autoClose: true },
    },
  ],
})
export class DesignPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    public ds: DesignService,
    private moveableService: MoveableService,
    private zone: NgZone
  ) {}

  foreColor = Colors.getColors().separatorColor;

  @ViewChild('host') host: ElementRef;
  @ViewChild('moveableContainer') moveableContainer: ElementRef;

  resizeObserver;

  ngOnInit(): void {
    this.ds.init();
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      this.zone.run(() => {
        let width = entries[0].contentRect.width;
        let height = entries[0].contentRect.height;

        if (this.ds.zoomMethod === 'fit') {
          this.ds.zoomFitInside(width, height);
        } else if (this.ds.zoomMethod === 'fill') {
          this.ds.zoomFillInside(width, height);
        }
      });
    });

    this.resizeObserver.observe(this.host.nativeElement);

    // this.addKeyEventListeners();

    this.moveableService.init();
  }

  ngOnDestroy() {
    this.resizeObserver.unobserve(this.host.nativeElement);
  }

  zoomOptions = [
    { value: 300, label: '300%' },
    { value: 200, label: '200%' },
    { value: 125, label: '125%' },
    { value: 100, label: '100%' },
    { value: 75, label: '75%' },
    { value: 50, label: '50%' },
    { value: 25, label: '25%' },
    { value: 10, label: '10%' },
  ];

  onSelectZoomOption(method: string, value?: number) {
    if (method === 'custom') {
      this.ds.zoomCustomValue(value);
    } else if (method === 'fit') {
      let width = this.host.nativeElement.clientWidth;
      let height = this.host.nativeElement.clientHeight;

      this.ds.zoomFitInside(width, height);
    } else if (method === 'fill') {
      let width = this.host.nativeElement.clientWidth;
      let height = this.host.nativeElement.clientHeight;

      this.ds.zoomFillInside(width, height);
    }
  }

  addPage() {
    this.ds.addPage();
  }
}
