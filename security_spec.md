# Security Specification - MS-Sumbe Mobilização Social

## 1. Data Invariants
1. **Supervisor Registry**: Every supervisor document in `/supervisores/{supervisorId}` represents an assigned field coordinator in Sumbe with valid `id`, `codigo`, `nome`, `comuna`, `coordenacao`, and active boolean state.
2. **Submissions Integrity**: Every submission document in `/submissoes/{submissaoId}` contains collection date, supervisor identification, municipality (Sumbe), and valid indicators with positive numerical totals.
3. **Consistency**: Changes made in the supervisor field app must synchronize with Firebase Firestore to ensure cross-device consistency and persistence.

## 2. The "Dirty Dozen" Payloads (Denial & Validation Scenarios)
1. **Unassigned Ghost Field Injection**: Injecting arbitrary root keys outside schema.
2. **Negative People Count**: Passing `totalPessoas < 0`.
3. **Falsified Supervisor Identity**: Mismatched supervisor ID and name.
4. **Invalid Date Format**: Using non-standard ISO or date string.
5. **Junk Path ID Attack**: Document ID exceeding 128 characters or containing illegal characters.
6. **Null Bairro Record**: Attempting to submit activity sheets without neighbourhood name.
7. **Privilege Escalation**: Modifying admin access without authentication.
8. **Orphaned Submissions**: Submissions with non-existent supervisor references.
9. **Tampered Total Calculations**: Inconsistent `totalSim` and `totalNao` values.
10. **Duplicate Supervisor Code**: Attempting to reuse an existing supervisor code.
11. **Malicious Script Injection**: Script tags in text fields (e.g. observacoes, nome).
12. **Denial of Wallet Flooding**: Sending arbitrarily large string arrays in place of structured objects.
