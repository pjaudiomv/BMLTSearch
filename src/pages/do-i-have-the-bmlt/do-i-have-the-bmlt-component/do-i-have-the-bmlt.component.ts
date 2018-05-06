import { Component } from '@angular/core';
import { Config } from '../../../app/app.config';
import { MeetingListProvider } from '../../../providers/meeting-list/meeting-list';
import { LoadingController } from 'ionic-angular';
import { ServiceGroupsProvider } from '../../../providers/service-groups/service-groups';
import { Storage } from '@ionic/storage';
import { Geolocation } from '@ionic-native/geolocation';
import { IonicPage, NavController, NavParams } from 'ionic-angular';


@Component({
  selector: 'page-do-i-have-the-bmlt',
  templateUrl: 'do-i-have-the-bmlt.html',
})
export class DoIHaveTheBmltComponent {

  currentAddress: any = "";
  addressLatitude: any = 0;
  addressLongitude: any = 0;
  loader = null;
  nearestMeeting: any = "";
  serviceGroupNames : any;
  bmltEnabled : string = 'maybe';

  constructor(  private config: Config,
                private MeetingListProvider: MeetingListProvider,
                private ServiceGroupsProvider: ServiceGroupsProvider,
                private loadingCtrl: LoadingController,
                private storage: Storage,
                private geolocation: Geolocation ) {

    console.log("getServiceGroupNames");
    this.ServiceGroupsProvider.getAllServiceGroups().subscribe((serviceGroupData)=>{
      this.serviceGroupNames = serviceGroupData;
      console.log("getServiceGroupNames were found");
      this.storage.get('savedAddressLat').then(value => {
        if (value) {
          console.log("addressLatitude was saved previously : ", value);
          this.addressLatitude = value;
          this.storage.get('savedAddressLng').then(value => {
            if (value) {
              console.log("addressLongitude was saved previously : ", value);
              this.addressLongitude = value;
              this.findNearestMeeting();
            } else {
              console.log("No addressLongitude previously saved");
              this.locatePhone();
            }
          });
        } else {
          console.log("No addressLatitude previously saved");
          this.locatePhone();
        }
  		});
    });
  }

  getServiceNameFromID(id) {
    var obj = this.serviceGroupNames.find(function (obj) { return obj.id === id; });
    return obj.name;
  }

  findNearestMeeting() {
    this.presentLoader("Finding Meetings...");
    this.MeetingListProvider.getNearestMeeting(this.addressLatitude , this.addressLongitude).subscribe((data)=>{
      this.nearestMeeting = data;
      this.nearestMeeting = this.nearestMeeting.filter(meeting => meeting.service_body_bigint = this.getServiceNameFromID(meeting.service_body_bigint));

      this.dismissLoader();
      console.log(this.nearestMeeting);
      console.log("Nearest meeting is ", this.nearestMeeting[0].distance_in_miles);
      if ( this.nearestMeeting[0].distance_in_miles < 100 ) {
        this.bmltEnabled = "true";
      } else {
        this.bmltEnabled = "false";
      }
    });
  }


  presentLoader(loaderText) {
    if (this.loader) {
      this.dismissLoader();
    }
    if (!this.loader) {
      this.loader = this.loadingCtrl.create({
        content: loaderText
      });
      this.loader.present();
    }
  }

  dismissLoader() {
    if (this.loader) {
      this.loader.dismiss();
      this.loader = null;
    }
  }

  locatePhone() {
    this.presentLoader("Locating Phone ...");
    this.geolocation.getCurrentPosition({ timeout: 10000 }).then((resp) => {
      console.log('Got location ok');

      this.addressLatitude = resp.coords.latitude;
      this.addressLongitude = resp.coords.longitude;

      this.storage.set('savedAddressLat', this.addressLatitude);
      this.storage.set('savedAddressLng', this.addressLongitude);
      this.findNearestMeeting();

    }).catch((error) => {
      console.log('Error getting location', error);
      this.currentAddress = "Location not found";
      this.dismissLoader();
    });
  }

}