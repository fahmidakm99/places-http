import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NavController,
  ModalController,
  ActionSheetController,
  LoadingController,
  AlertController,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { PlacesService } from '../../places.service';
import { CreateBookingComponent } from '../../../bookings/create-booking/create-booking.component';
import { BookingService } from '../../../bookings/booking.service';
import { AuthService } from '../../../auth/auth.service';
import { Place } from '../../place.model';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit {
  place!: Place;
  placeId!: string;
  isBookable = false;
  isLoading = false;
  private placeSub!: Subscription;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private bookingService: BookingService,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  // ngOnInit() {
  //   this.route.paramMap.subscribe(paramMap => {
  //     if (!paramMap.has('placeId')) {
  //       this.navCtrl.navigateBack('/places/tabs/search');
  //       return;
  //     }
  //     this.isLoading = true;
  //     this.placeSub = this.placesService
  //       .getPlace(paramMap.get('placeId'))
  //       .subscribe(
  //         place => {
  //           this.place = place;
  //           this.isBookable = place.userId !== this.authService.userId;
  //           this.isLoading = false;
  //         },
  //         error => {
  //           this.alertCtrl
  //             .create({
  //               header: 'An error ocurred!',
  //               message: 'Could not load place.',
  //               buttons: [
  //                 {
  //                   text: 'Okay',
  //                   handler: () => {
  //                     this.router.navigate(['/places/tabs/search']);
  //                   }
  //                 }
  //               ]
  //             })
  //             .then(alertEl => alertEl.present());
  //         }
  //       );
  //   });
  // }

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      const placeId = paramMap.get('placeId');
      if (!placeId) {
        this.navCtrl.navigateBack('/places/tabs/search');
        return;
      }

      this.isLoading = true;
      this.placeSub = this.placesService.getPlace(placeId).subscribe({
        next: (place) => {
          if (place) {
            this.place = place;
            this.isBookable = place.userId !== this.authService.userId;
            console.log(
              this.isBookable,
              'place.userId:   ' + place.userId,
              'authservice.userId :   ' + this.authService.userId
            );
            this.isLoading = false;
          } else {
            console.error('Place is undefined');
          }
        },
        error: (error) => {
          this.alertCtrl
            .create({
              header: 'An error occurred!',
              message: 'Could not load place.',
              buttons: [
                {
                  text: 'Okay',
                  handler: () => {
                    this.router.navigate(['/places/tabs/search']);
                  },
                },
              ],
            })
            .then((alertEl) => alertEl.present());
        },
      });
    });
  }

  // ngOnInit() {
  //   this.route.paramMap.subscribe((paramMap) => {
  //     if (!paramMap.has('placeId')) {
  //       this.navCtrl.navigateBack(['/places/tabs/search']);
  //       return;
  //     }

  //     //   this.placeId = paramMap.get('placeId') ?? this.placeId;
  //     //   // console.log(this.placesService.getPlace(paramMap.get('placeId')));
  //     //   this.place = this.placesService.getPlace(this.placeId);
  //     // });
  //     this.isLoading = true;
  //     const placeId = paramMap.get('placeId');

  //     if (placeId === null || placeId === undefined) {
  //       console.error('No placeId provided');
  //       return;
  //     }

  //     this.placeSub = this.placesService
  //       .getPlace(placeId)
  //       .subscribe((place) => {
  //         if (place) {
  //           this.place = place;
  //           this.isBookable = place.userId !== this.authService.userId;
  //           this.isLoading = false;
  //         } else {
  //           console.error('Place is undefined');
  //         }
  //       },
  //       error => {
  //         this.alertCtrl
  //         .create({
  //           header: 'An error ocurred!',
  //           message: 'Could not load place.',
  //           buttons: [
  //             {
  //               text: 'Okay',
  //               handler: () => {
  //                 this.router.navigate(['/places/tabs/search']);
  //               }
  //             }
  //           ]
  //         })
  //         .then(alertEl => alertEl.present());
  //       }
  //       );
  //   });
  // }

  onBookPlace() {
    // this.router.navigateByUrl('/places/tabs/search');
    // this.navCtrl.navigateBack('/places/tabs/search');
    // this.navCtrl.pop();
    this.actionSheetCtrl
      .create({
        header: 'Choose an Action',
        buttons: [
          {
            text: 'Select Date',
            handler: () => {
              this.openBookingModal('select');
            },
          },
          {
            text: 'Random Date',
            handler: () => {
              this.openBookingModal('random');
            },
          },
          {
            text: 'Cancel',
            role: 'cancel',
          },
        ],
      })
      .then((actionSheetEl) => {
        actionSheetEl.present();
      });
  }

  openBookingModal(mode: 'select' | 'random') {
    console.log(mode);
    this.modalCtrl
      .create({
        component: CreateBookingComponent,
        componentProps: { selectedPlace: this.place, selectedMode: mode },
      })
      .then((modalEl) => {
        modalEl.present();
        return modalEl.onDidDismiss();
      })
      .then((resultData) => {
        if (resultData.role === 'confirm') {
          this.loadingCtrl
            .create({ message: 'Booking place...' })
            .then((loadingEl) => {
              loadingEl.present();
              const data = resultData.data.bookingData;
              this.bookingService
                .addBooking(
                  this.place.id,
                  this.place.title,
                  this.place.imageUrl,
                  data.firstName,
                  data.lastName,
                  data.guestNumber,
                  data.startDate,
                  data.endDate
                )
                .subscribe(() => {
                  loadingEl.dismiss();
                });
            });
        }
      });
  }

  ngOnDestroy() {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }
}
