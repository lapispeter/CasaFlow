import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  
  url='http://localhost:8000/shoppingLists'
  constructor(private http: HttpClient) { }

  getShoppingLists(){
    return this.http.get(this.url)
  }
  createShoppingList(shoppinglist: any){
    return this.http.post(this.url, shoppinglist)
  }
  updateShoppingList(shoppinglist: any){
    return this.http.put(this.url +'/'+ shoppinglist.id, shoppinglist)
  }
  deleteShoppingList(id: number){
    return this.http.delete(this.url +'/'+ id)
  }
}
