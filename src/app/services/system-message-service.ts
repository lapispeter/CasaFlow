import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { AuthService } from './auth'

@Injectable({ providedIn: 'root' })
export class SystemMessageService {
  private apiUrl = 'http://localhost:8000/api'

  constructor(private http: HttpClient, private auth: AuthService) {}

  getSystemMessage() {
    return this.http.get(`${this.apiUrl}/system-message`)
  }

  updateSystemMessage(message: string) {
    const token = this.auth.getToken()
    return this.http.put(
      `${this.apiUrl}/admin/system-message`,
      { message },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
  }
}
