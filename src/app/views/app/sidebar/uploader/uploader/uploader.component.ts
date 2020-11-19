import { Component, OnInit } from '@angular/core';
import { MyfilesService } from 'src/app/services/myfiles.service';
import { AuthService } from 'src/app/shared/auth.service';
import { MyFile } from 'src/app/services/myfiles.service';
import { DesignService } from 'src/app/services/design.service';
@Component({
  selector: 'uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss'],
})
export class UploaderComponent implements OnInit {
  constructor(
    public myfilesService: MyfilesService,
    public authService: AuthService,
    private designService: DesignService
  ) {}

  ngOnInit() {
    if (!this.myfilesService.myfiles$) this.myfilesService.init();
  }

  isHovering: boolean;

  files: File[] = [];

  toggleHover(event: boolean) {
    this.isHovering = event;
  }

  onDrop(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      this.files.push(files.item(i));
    }
  }

  onImgClick(myfile: MyFile) {
    this.designService.uploads_click_image(myfile);
  }
}
