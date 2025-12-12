import { Component } from '@angular/core';
import { ShoppingListService } from '../../../services/shopping-list-service';


@Component({
  selector: 'app-shopping-list',
  imports: [],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.css',
})
export class ShoppingList {

  shoppinglists: any;

  constructor(private api: ShoppingListService) { }

  ngOnInit() {
    this.getShoppingLists();
  }

  getShoppingLists() {
    this.api.getShoppingLists().subscribe({
      next: (res) => {
        console.log(res)
        this.shoppinglists = res
      }
    })
  }
  createShoppingList () {} 
  updateShoppingList () {}
  deleteShoppingList () {} 


}
