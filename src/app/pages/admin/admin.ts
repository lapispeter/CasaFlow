import { Component } from '@angular/core'
import { ReactiveFormsModule, FormBuilder } from '@angular/forms'
import { FormsModule } from '@angular/forms'
import { AdminService } from '../../services/admin-service'
import { AuthService } from '../../services/auth'
import { SystemMessageService } from '../../services/system-message-service'

type DeleteChecks = {
  userDeleted?: boolean
  billsDeleted?: number
  meterReadingsDeleted?: number
  remindersDeleted?: number
  shoppingListDeleted?: number
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin {
  users: any[] = []
  stats: any = { activeCount: 0, passiveCount: 0 }

  searchForm: any
  infoMessage = ''

  private currentUserId: number | null = null

  // ✅ törlés eredmény doboz
  lastDeleteResult: { message: string; checks: DeleteChecks } | null = null

  // ✅ SYSTEM MESSAGE
  systemMessageText = ''
  systemMessageInfo = ''

  constructor(
    private api: AdminService,
    private fb: FormBuilder,
    private auth: AuthService,
    private sysMsg: SystemMessageService
  ) {}

  ngOnInit() {
    this.currentUserId = this.auth.getCurrentUserId()

    this.searchForm = this.fb.group({
      query: ['']
    })

    this.loadStats()

    // ✅ induláskor ne listázzon
    this.users = []
    this.infoMessage = 'Keress név vagy email alapján.'

    // ✅ system message betöltése
    this.loadSystemMessage()
  }

  // ---------------------------
  // ✅ LOGOUT
  // ---------------------------
  logout() {
    this.auth.logout()
  }

  // ---------------------------
  // ✅ SYSTEM MESSAGE
  // ---------------------------
  loadSystemMessage() {
    this.sysMsg.getSystemMessage().subscribe({
      next: (res: any) => {
        const d = res.data ?? res
        this.systemMessageText = d.message ?? ''
      },
      error: (err) => console.log(err)
    })
  }

  saveSystemMessage() {
    const msg = String(this.systemMessageText ?? '').trim()

    this.sysMsg.updateSystemMessage(msg).subscribe({
      next: () => {
        this.systemMessageInfo = 'Mentve ✅'
        setTimeout(() => (this.systemMessageInfo = ''), 2000)
      },
      error: (err) => {
        console.log(err)
        this.systemMessageInfo = 'Hiba mentés közben ❌'
      }
    })
  }

  // ---------------------------
  // ✅ DELETE RESULT BOX
  // ---------------------------
  clearDeleteResult() {
    this.lastDeleteResult = null
  }

  // ---------------------------
  // ✅ STATS
  // ---------------------------
  loadStats() {
    this.api.getStats().subscribe({
      next: (res: any) => {
        const d = res.data ?? res
        this.stats = d
      },
      error: (err) => console.log(err)
    })
  }

  // ---------------------------
  // ✅ SEARCH
  // ---------------------------
  searchUsers() {
    this.lastDeleteResult = null

    const query = String(this.searchForm.value.query ?? '').trim()

    if (!query) {
      this.users = []
      this.infoMessage = 'Írj be legalább 1 karaktert a kereséshez.'
      return
    }

    this.api.searchUsers(query).subscribe({
      next: (res: any) => {
        const list = res.data ?? res
        this.users = Array.isArray(list) ? list : []
        this.infoMessage = this.users.length === 0 ? 'Nincs találat.' : ''
      },
      error: (err) => {
        console.log(err)
        this.infoMessage = 'Hiba történt a keresésnél.'
      }
    })
  }

  loadPassiveUsers() {
    this.lastDeleteResult = null

    this.api.getPassiveUsers().subscribe({
      next: (res: any) => {
        const list = res.data ?? res
        this.users = Array.isArray(list) ? list : []
        this.infoMessage = this.users.length === 0 ? 'Nincs passzív user.' : ''
      },
      error: (err) => {
        console.log(err)
        this.infoMessage = 'Hiba történt a passzív lista lekérésénél.'
      }
    })
  }

  // ---------------------------
  // ✅ DELETE USER
  // ---------------------------
  deleteUser(u: any) {
    this.lastDeleteResult = null

    // ✅ admin usert ne lehessen törölni
    if (u.roleId === 1) {
      alert('Admin felhasználót nem lehet törölni.')
      return
    }

    // ✅ saját magát se törölhesse
    if (this.currentUserId && u.id === this.currentUserId) {
      alert('Saját fiókot nem törölhetsz.')
      return
    }

    const ok = confirm(`Biztos törlöd a usert?\n\n${u.name} (${u.email})`)
    if (!ok) return

    this.api.deleteUser(u.id).subscribe({
      next: (res: any) => {
        const message = res?.message ?? 'Törlés lefutott.'
        const checks = res?.checks ?? {}

        this.lastDeleteResult = { message, checks }

        this.loadStats()
        // ha keresésből jött, frissítsük a listát
        this.searchUsers()
      },
      error: (err) => {
        console.log(err)
        alert('Nem sikerült törölni.')
      }
    })
  }
}
