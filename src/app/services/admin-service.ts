import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { AuthService } from './auth'

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'http://localhost:8000/api/admin'

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders() {
    const token = this.auth.getToken()
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  }

  searchUsers(query: string) {
    return this.http.get(`${this.apiUrl}/users?query=${encodeURIComponent(query)}`, this.getHeaders())
  }

  getStats() {
    return this.http.get(`${this.apiUrl}/stats/users`, this.getHeaders())
  }

  getPassiveUsers() {
    return this.http.get(`${this.apiUrl}/users/passive`, this.getHeaders())
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.apiUrl}/users/${id}`, this.getHeaders())
  }
}
