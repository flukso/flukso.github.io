import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import * as dataForge from 'data-forge';

declare var Tmpo: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'flukso-export';

  maxDate = new Date();
  sid: FormControl;
  token: FormControl;
  dateRange: FormControl;
  resolution: FormControl;
  cResolution: FormControl;
  diff: FormControl;

  resolutions: any[] = [
    {
      'name': '1 Second',
      'value': 1,
    },
    {
      'name': '1 Minute',
      'value': 60,
    },
    {
      'name': '15 Minutes',
      'value': 60 * 15,
    },
    {
      'name': '1 Hour',
      'value': 60 * 60,
    },
    {
      'name': '1 Day',
      'value': 60 * 60 * 24,
    }
  ];


  constructor() {
    var d = new Date();
    // Set it to one month ago
    d.setMonth(d.getMonth() - 1);
    // Zero the hours
    d.setHours(0, 0, 0);
    // Zero the milliseconds
    d.setMilliseconds(0);

    this.sid = new FormControl('', Validators.required);
    this.token = new FormControl('', Validators.required);
    this.dateRange = new FormControl([d, this.maxDate], Validators.required);
    this.resolution = new FormControl(this.resolutions[2].value, Validators.required);
    this.cResolution = new FormControl(60 * 15, Validators.required);
    this.diff = new FormControl(false, Validators.required);
  }

  export() {

    const tmpo = new Tmpo(null, this.token.value, false);

    try {
      tmpo.sync_sensor([this.sid.value], (progress) => {

        if (progress.all.state == "completed") {
          var head = this.dateRange.value[0].getTime() / 1000;
          var tail = this.dateRange.value[1].getTime() / 1000;

          tmpo.series(this.sid.value, { subsample: this.resolution.value == 0 ? this.cResolution.value : this.resolution.value, head: head, tail: tail }).then(
            (series) => {
              console.log(series);
              
              var xValues = (series.t as number[]).map(d => new Date(d * 1000));
              console.log(this.diff.value);
              if (!this.diff.value) {
              var yValues = series.v as number[];
              }
              else {
                var yValues = this._diff(series.v as number[]);
              }

              var columns: any = {};
              columns['timeStamp'] = xValues;
              columns[this.sid.value] = yValues;
              
              var df: dataForge.IDataFrame = new dataForge.DataFrame({
                columns: columns,
              });
              df = df.setIndex('timeStamp');

              const link = document.createElement('a');
              link.setAttribute('download', this.sid.value + '.csv');
              link.setAttribute('href', encodeURI(`data:text/csv;charset=utf-8,${df.toCSV()}`));
              link.click();
            }
          );
        }
      });
    }
    catch (exception) {
      console.log(exception);
    }

  }

  _diff(list: number[]): number[] {
    let newList: number[] = [];
    for (let i = 0; i < list.length; i++) {
      newList.push(i != 0 ? list[i] - list[i - 1] : null);
    }
    return newList;
  }
}
