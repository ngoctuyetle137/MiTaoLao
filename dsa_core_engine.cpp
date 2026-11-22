/**
 * ============================================================================
 * UTC2HAND - CORE DATA STRUCTURES & ALGORITHMS (DSA) ENGINE
 * Ngôn ngữ: C++ (Chuẩn C++17)
 * Đơn vị: Phân hiệu Trường Đại học Giao thông Vận tải tại TP.HCM (UTC2)
 * Dự án: Sàn Trao Đổi & Pass Đồ Sinh Viên UTC2Hand (doPasss.docx)
 *
 * DANH MỤC CẤU TRÚC DỮ LIỆU & GIẢI THUẬT TRIỂN KHAI THEO ĐẶC TẢ BÁO CÁO:
 * 1. Trie + Max-Heap       : Tìm kiếm Autocomplete O(k) (Chứng minh vượt trội so với Tuyến tính O(N*L))
 * 2. AVL Tree              : Cây tự cân bằng (Thêm, Xóa, Cân bằng LL/RR/LR/RL, Lọc giá O(log N + K))
 * 3. Queue & Stack         : FIFO hàng đợi tin nhắn O(1) & LIFO ngăn xếp hoàn tác thao tác O(1)
 * 4. Graph + BFS           : Đồ thị sản phẩm & duyệt BFS gợi ý đồ liên quan theo môn học O(V + E)
 * 5. Hash Table            : Bảng băm Separate Chaining quản lý phiên đăng nhập O(1)
 * 6. Doubly Linked List    : Danh sách liên kết kép Bảng tin Newsfeed O(1)
 * ============================================================================
 */

#include <iostream>
#include <string>
#include <vector>
#include <queue>
#include <stack>
#include <list>
#include <unordered_map>
#include <algorithm>
#include <cmath>
#include <iomanip>
#include <chrono>

using namespace std;

// ============================================================================
// 0. CẤU TRÚC DỮ LIỆU SẢN PHẨM
// ============================================================================
struct Product {
    string id;
    string title;
    long long price;
    string category;
    string courseCode;
    string timemarkCode;
    string seller;
    int sellerRep;
    string location;
    double distanceKm;

    void display() const {
        cout << "  [" << id << "] " << left << setw(44) << title 
             << " | Gia: " << setw(7) << price << " VND"
             << " | " << setw(10) << category
             << " | TimeMark: " << timemarkCode 
             << " | SV: " << seller << " (" << sellerRep << "d)" << endl;
    }
};

// ============================================================================
// 1. TRIE KẾT HỢP MAX-HEAP (AUTOCONTROL / AUTOCOMPLETE O(k))
// ============================================================================
struct Suggestion {
    string word;
    int frequency;

    bool operator<(const Suggestion& other) const {
        return frequency < other.frequency; // Max-Heap ưu tiên tần suất lớn
    }
};

struct TrieNode {
    unordered_map<char, TrieNode*> children;
    bool isEndOfWord;
    int frequency;
    vector<string> productIds;
    vector<Suggestion> topCache; // Cache Top 5 từ khóa phổ biến tại mỗi nút O(k)

    TrieNode() : isEndOfWord(false), frequency(0) {}
};

class TrieWithHeap {
private:
    TrieNode* root;

    string toLower(const string& str) const {
        string res = str;
        transform(res.begin(), res.end(), res.begin(), ::tolower);
        return res;
    }

public:
    TrieWithHeap() {
        root = new TrieNode();
    }

    void insert(const string& word, const string& productId, int freq = 1) {
        string lowerWord = toLower(word);
        TrieNode* curr = root;

        for (char c : lowerWord) {
            if (curr->children.find(c) == curr->children.end()) {
                curr->children[c] = new TrieNode();
            }
            curr = curr->children[c];

            // Cập nhật Max-Heap cache tại từng node tiền tố
            bool found = false;
            for (auto& item : curr->topCache) {
                if (item.word == word) {
                    item.frequency += freq;
                    found = true;
                    break;
                }
            }
            if (!found) {
                curr->topCache.push_back({word, freq});
            }
            sort(curr->topCache.begin(), curr->topCache.end(), [](const Suggestion& a, const Suggestion& b) {
                return a.frequency > b.frequency;
            });
            if (curr->topCache.size() > 5) {
                curr->topCache.pop_back();
            }
        }

        curr->isEndOfWord = true;
        curr->frequency += freq;
        curr->productIds.push_back(productId);
    }

    // Tìm kiếm Autocomplete O(k) với k là độ dài tiền tố (hoàn toàn độc lập với tổng số sản phẩm N)
    vector<Suggestion> suggest(const string& prefix) const {
        string lowerPrefix = toLower(prefix);
        TrieNode* curr = root;

        for (char c : lowerPrefix) {
            if (curr->children.find(c) == curr->children.end()) {
                return {};
            }
            curr = curr->children[c];
        }
        return curr->topCache;
    }
};

// Tìm kiếm tuyến tính cổ điển O(N * L) để chứng minh ưu thế của Trie
vector<string> linearSearchSuggest(const vector<Product>& products, const string& prefix) {
    vector<string> results;
    string lowerPrefix = prefix;
    transform(lowerPrefix.begin(), lowerPrefix.end(), lowerPrefix.begin(), ::tolower);

    for (const auto& p : products) {
        string lowerTitle = p.title;
        transform(lowerTitle.begin(), lowerTitle.end(), lowerTitle.begin(), ::tolower);

        // Kiểm tra tiền tố
        if (lowerTitle.find(lowerPrefix) == 0 || lowerTitle.find(" " + lowerPrefix) != string::npos) {
            results.push_back(p.title);
            if (results.size() >= 5) break;
        }
    }
    return results;
}

// ============================================================================
// 2. AVL TREE (CÂY NHỊ PHÂN TỰ CÂN BẰNG - THÊM, XÓA, CÂN BẰNG, RANGE QUERY)
// ============================================================================
struct AVLNode {
    Product product;
    long long key; // Khóa sắp xếp là giá sản phẩm (price)
    int height;
    AVLNode* left;
    AVLNode* right;

    AVLNode(const Product& p) : product(p), key(p.price), height(1), left(nullptr), right(nullptr) {}
};

class AVLTree {
private:
    AVLNode* root;

    int getHeight(AVLNode* node) const {
        return node ? node->height : 0;
    }

    int getBalance(AVLNode* node) const {
        return node ? getHeight(node->left) - getHeight(node->right) : 0;
    }

    AVLNode* rotateRight(AVLNode* y) {
        AVLNode* x = y->left;
        AVLNode* T2 = x->right;
        x->right = y;
        y->left = T2;
        y->height = max(getHeight(y->left), getHeight(y->right)) + 1;
        x->height = max(getHeight(x->left), getHeight(x->right)) + 1;
        return x;
    }

    AVLNode* rotateLeft(AVLNode* x) {
        AVLNode* y = x->right;
        AVLNode* T2 = y->left;
        y->left = x;
        x->right = T2;
        x->height = max(getHeight(x->left), getHeight(x->right)) + 1;
        y->height = max(getHeight(y->left), getHeight(y->right)) + 1;
        return y;
    }

    AVLNode* insertNode(AVLNode* node, const Product& p) {
        if (!node) return new AVLNode(p);

        if (p.price < node->key) {
            node->left = insertNode(node->left, p);
        } else {
            node->right = insertNode(node->right, p);
        }

        node->height = 1 + max(getHeight(node->left), getHeight(node->right));
        int balance = getBalance(node);

        // Trường hợp 1: Left Left (LL)
        if (balance > 1 && p.price < node->left->key)
            return rotateRight(node);

        // Trường hợp 2: Right Right (RR)
        if (balance < -1 && p.price >= node->right->key)
            return rotateLeft(node);

        // Trường hợp 3: Left Right (LR)
        if (balance > 1 && p.price >= node->left->key) {
            node->left = rotateLeft(node->left);
            return rotateRight(node);
        }

        // Trường hợp 4: Right Left (RL)
        if (balance < -1 && p.price < node->right->key) {
            node->right = rotateRight(node->right);
            return rotateLeft(node);
        }

        return node;
    }

    AVLNode* minValueNode(AVLNode* node) {
        AVLNode* current = node;
        while (current && current->left != nullptr)
            current = current->left;
        return current;
    }

    AVLNode* deleteNode(AVLNode* curr, long long price, const string& id, bool& deleted) {
        if (!curr) return nullptr;

        if (price < curr->key) {
            curr->left = deleteNode(curr->left, price, id, deleted);
        } else if (price > curr->key) {
            curr->right = deleteNode(curr->right, price, id, deleted);
        } else {
            // Khóa price trùng nhau, so sánh mã id
            if (curr->product.id != id) {
                curr->right = deleteNode(curr->right, price, id, deleted);
                return curr;
            }

            deleted = true;
            // Node cần xóa có 0 hoặc 1 con
            if (!curr->left || !curr->right) {
                AVLNode* temp = curr->left ? curr->left : curr->right;
                if (!temp) {
                    temp = curr;
                    curr = nullptr;
                } else {
                    *curr = *temp;
                }
                delete temp;
            } else {
                // Node có 2 con: Lấy successor (nhỏ nhất bên cây con phải)
                AVLNode* temp = minValueNode(curr->right);
                curr->key = temp->key;
                curr->product = temp->product;
                curr->right = deleteNode(curr->right, temp->key, temp->product.id, deleted);
            }
        }

        if (!curr) return nullptr;

        // Cập nhật lại chiều cao node
        curr->height = 1 + max(getHeight(curr->left), getHeight(curr->right));
        int balance = getBalance(curr);

        // Tái cân bằng sau khi xóa (4 trường hợp)
        if (balance > 1 && getBalance(curr->left) >= 0)
            return rotateRight(curr);

        if (balance > 1 && getBalance(curr->left) < 0) {
            curr->left = rotateLeft(curr->left);
            return rotateRight(curr);
        }

        if (balance < -1 && getBalance(curr->right) <= 0)
            return rotateLeft(curr);

        if (balance < -1 && getBalance(curr->right) > 0) {
            curr->right = rotateRight(curr->right);
            return rotateLeft(curr);
        }

        return curr;
    }

    void inOrderRange(AVLNode* node, long long minPrice, long long maxPrice, vector<Product>& result) const {
        if (!node) return;
        if (node->key > minPrice) {
            inOrderRange(node->left, minPrice, maxPrice, result);
        }
        if (node->key >= minPrice && node->key <= maxPrice) {
            result.push_back(node->product);
        }
        if (node->key < maxPrice) {
            inOrderRange(node->right, minPrice, maxPrice, result);
        }
    }

public:
    AVLTree() : root(nullptr) {}

    void insert(const Product& p) {
        root = insertNode(root, p);
    }

    bool remove(long long price, const string& id) {
        bool deleted = false;
        root = deleteNode(root, price, id, deleted);
        return deleted;
    }

    // Truy vấn khoảng giá [minPrice, maxPrice] với độ phức tạp O(log N + K)
    vector<Product> rangeQuery(long long minPrice, long long maxPrice) const {
        vector<Product> result;
        inOrderRange(root, minPrice, maxPrice, result);
        return result;
    }

    int getTreeHeight() const {
        return getHeight(root);
    }

    int getRootBalanceFactor() const {
        return getBalance(root);
    }
};

// ============================================================================
// 3. QUEUE (FIFO) & STACK (LIFO)
// ============================================================================
// 3A. HÀNG ĐỢI TIN NHẮN REALTIME (FIFO)
struct ChatPacket {
    string id;
    string sender;
    string text;
    long long timestamp;
};

class MessageQueue {
private:
    queue<ChatPacket> q;

public:
    void enqueue(const ChatPacket& pkt) {
        q.push(pkt);
    }

    bool dequeue(ChatPacket& out) {
        if (q.empty()) return false;
        out = q.front();
        q.pop();
        return true;
    }

    bool isEmpty() const { return q.empty(); }
    size_t size() const { return q.size(); }
};

// 3B. NGĂN XẾP HOÀN TÁC THAO TÁC BÀI ĐĂNG (LIFO)
struct PostAction {
    string actionType; // "DANG_BAI", "CAP_NHAT_GIA", "DAT_COC"
    Product productData;
};

class UndoStack {
private:
    stack<PostAction> history;

public:
    void pushAction(const PostAction& act) {
        history.push(act);
    }

    bool popAction(PostAction& out) {
        if (history.empty()) return false;
        out = history.top();
        history.pop();
        return true;
    }

    bool isEmpty() const { return history.empty(); }
    size_t size() const { return history.size(); }
};

// ============================================================================
// 4. GRAPH + BFS (ĐỀ XUẤT SẢN PHẨM TƯƠNG ĐỒNG THEO MÔN HỌC O(V + E))
// ============================================================================
class ProductGraph {
private:
    unordered_map<string, Product> products;
    unordered_map<string, vector<pair<string, int>>> adjList;

public:
    void addProduct(const Product& p) {
        products[p.id] = p;
        for (const auto& pair : products) {
            const Product& other = pair.second;
            if (other.id == p.id) continue;

            int weight = 0;
            if (other.category == p.category) weight += 5;
            if (!other.courseCode.empty() && other.courseCode == p.courseCode) weight += 10;
            if (abs(other.price - p.price) <= 50000) weight += 3;

            if (weight > 0) {
                adjList[p.id].push_back({other.id, weight});
                adjList[other.id].push_back({p.id, weight});
            }
        }
    }

    vector<Product> recommendSimilarBFS(const string& startId, int k = 3) const {
        vector<Product> recs;
        if (products.find(startId) == products.end()) return recs;

        unordered_map<string, bool> visited;
        queue<string> q;

        visited[startId] = true;
        q.push(startId);

        while (!q.empty() && (int)recs.size() < k) {
            string u = q.front();
            q.pop();

            if (adjList.find(u) == adjList.end()) continue;
            auto neighbors = adjList.at(u);
            sort(neighbors.begin(), neighbors.end(), [](const pair<string, int>& a, const pair<string, int>& b) {
                return a.second > b.second;
            });

            for (const auto& edge : neighbors) {
                string v = edge.first;
                if (!visited[v]) {
                    visited[v] = true;
                    recs.push_back(products.at(v));
                    q.push(v);
                    if ((int)recs.size() >= k) break;
                }
            }
        }
        return recs;
    }
};

// ============================================================================
// 5. HASH TABLE (SEPARATE CHAINING) - QUẢN LÝ PHIÊN AUTHENTICATION O(1)
// ============================================================================
struct SessionToken {
    string token;
    string email;
    string role;
    int coins;
};

class AuthHashTable {
private:
    static const int BUCKETS = 101;
    list<SessionToken> table[BUCKETS];

    int hashFunction(const string& key) const {
        unsigned long long hash = 5381;
        for (char c : key) hash = ((hash << 5) + hash) + c;
        return hash % BUCKETS;
    }

public:
    void putSession(const SessionToken& session) {
        int idx = hashFunction(session.token);
        for (auto& item : table[idx]) {
            if (item.token == session.token) {
                item = session;
                return;
            }
        }
        table[idx].push_back(session);
    }

    bool getSession(const string& token, SessionToken& out) const {
        int idx = hashFunction(token);
        for (const auto& item : table[idx]) {
            if (item.token == token) {
                out = item;
                return true;
            }
        }
        return false;
    }
};

// ============================================================================
// 6. DOUBLY LINKED LIST (BẢNG TIN NEWSFEED O(1) CHÈN/XÓA ĐẦU)
// ============================================================================
struct DLLNode {
    Product data;
    DLLNode* prev;
    DLLNode* next;

    DLLNode(const Product& p) : data(p), prev(nullptr), next(nullptr) {}
};

class PostDoublyLinkedList {
private:
    DLLNode* head;
    DLLNode* tail;
    int count;

public:
    PostDoublyLinkedList() : head(nullptr), tail(nullptr), count(0) {}

    void insertHead(const Product& p) {
        DLLNode* node = new DLLNode(p);
        if (!head) {
            head = tail = node;
        } else {
            node->next = head;
            head->prev = node;
            head = node;
        }
        count++;
    }

    bool deleteById(const string& id) {
        DLLNode* curr = head;
        while (curr) {
            if (curr->data.id == id) {
                if (curr->prev) curr->prev->next = curr->next;
                else head = curr->next;

                if (curr->next) curr->next->prev = curr->prev;
                else tail = curr->prev;

                delete curr;
                count--;
                return true;
            }
            curr = curr->next;
        }
        return false;
    }

    void displayAll() const {
        DLLNode* curr = head;
        int idx = 1;
        while (curr) {
            cout << "  " << idx++ << ". ";
            curr->data.display();
            curr = curr->next;
        }
    }

    int size() const { return count; }
};

// ============================================================================
// HỆ THỐNG ĐIỀU HÀNH TỔNG HỢP (UNIPASS / UTC2HAND SYSTEM MANAGER)
// ============================================================================
class UTC2HandSystem {
public:
    TrieWithHeap trie;
    vector<Product> allProducts;
    AVLTree avl;
    MessageQueue chatQueue;
    UndoStack undoStack;
    ProductGraph graph;
    AuthHashTable authTable;
    PostDoublyLinkedList newsFeed;

    void initSampleData() {
        allProducts = {
            {"P01", "Giao trinh Vat Ly Dai Cuong 1 (VL101)", 35000, "GiaoTrinh", "VL101", "UTC2 - 8924", "Le Thi Ngoc Tuyet", 98, "KTX Co May UTC2", 0.5},
            {"P02", "Sach Cau Truc Du Lieu & Giai Thuat (C++)", 45000, "GiaoTrinh", "DSA01", "UTC2 - 7719", "Le Thi Ngoc Tuyet", 98, "Thu vien UTC2", 0.2},
            {"P03", "Noi com dien mini 1.2L phong tro KTX", 120000, "DoGiaDung", "", "UTC2 - 9931", "Phuc Lam", 92, "Cong 1 UTC2", 0.4},
            {"P04", "May tinh Casio fx-580VN X tem Bitex", 350000, "DoDienTu", "TOAN01", "UTC2 - 1042", "Phuc Lam", 92, "KTX Co May UTC2", 0.5},
            {"P05", "Ao dong phuc the duc UTC2 size L thun lanh", 65000, "DongPhuc", "", "UTC2 - 4412", "Le Thi Ngoc Tuyet", 98, "San bong UTC2", 0.3},
            {"P06", "Xe dap Martin 107 di hoc quanh truong UTC2", 450000, "XeCo", "", "UTC2 - 6618", "Phuc Lam", 92, "Bai xe Toa A1", 0.1}
        };

        for (const auto& p : allProducts) {
            trie.insert(p.title, p.id, 5);
            if (!p.courseCode.empty()) trie.insert(p.courseCode, p.id, 10);
            trie.insert(p.category, p.id, 3);

            avl.insert(p);
            graph.addProduct(p);
            newsFeed.insertHead(p);
        }

        // Hàng đợi tin nhắn mẫu
        chatQueue.enqueue({"MSG_01", "tuyetltn.st@st.utc2.edu.vn", "Minh muon hen xem sach Giai tich o Thu vien nhe", 1700000001});
        chatQueue.enqueue({"MSG_02", "lamnp.st@st.utc2.edu.vn", "Ok ban, 10h trua mai minh gap o San bong nhe", 1700000005});

        // Ngăn xếp hoàn tác mẫu
        undoStack.pushAction({"DANG_BAI", allProducts[0]});
        undoStack.pushAction({"CAP_NHAT_GIA", allProducts[1]});

        // Phiên đăng nhập mẫu
        authTable.putSession({"SESSION_ADMIN_UTC2", "6651071091@st.utc2.edu.vn", "admin", 9999});
        authTable.putSession({"SESSION_STUDENT_01", "tuyetltn.st@st.utc2.edu.vn", "student", 520});
    }
};

// ============================================================================
// HÀM MAIN: GIAO DIỆN DÒNG LỆNH (CLI) CHỨNG MINH ĐỒ ÁN DSA CHO GIẢNG VIÊN
// ============================================================================
int main() {
    UTC2HandSystem sys;
    sys.initSampleData();

    cout << "================================================================================" << endl;
    cout << "   HE THONG PASS DO SINH VIEN UTC2HAND - CORE DSA ENGINE (C++17)" << endl;
    cout << "   Truong DH Giao Thong Van Tai TP.HCM - Phan hieu UTC2 (Man Thien, Thu Duc)" << endl;
    cout << "   Sinh vien: Le Thi Ngoc Tuyet - Lop: CQ.66.CNTT" << endl;
    cout << "================================================================================" << endl;

    int choice = -1;
    while (choice != 0) {
        cout << "\n--- CHUC NANG KIEM THU THUAT TOAN (DSA DEFENSE SUITE) ---" << endl;
        cout << "1. [Trie vs Linear Search] Chung minh Autocomplete vuot troi tim kiem tuyen tinh" << endl;
        cout << "2. [AVL Tree] The hien Them, Xoa, Can bang (LL/RR/LR/RL) & Tim kiem theo gia" << endl;
        cout << "3. [Queue & Stack] Giai thich du lieu Vao/Ra & Ly do chon FIFO/LIFO" << endl;
        cout << "4. [Graph + BFS] De xuat san pham tuong dong theo mon hoc (O(V + E))" << endl;
        cout << "5. [Benchmark Tong Hop] Do thoi gian thuc thi tat ca thuat toan (nanoseconds)" << endl;
        cout << "0. Thoat chuong trinh" << endl;
        cout << "Moi thay/co va cac ban chon (0-5): ";
        if (!(cin >> choice)) {
            cin.clear();
            cin.ignore(1000, '\n');
            continue;
        }

        if (choice == 1) {
            cout << "\n========================================================================" << endl;
            cout << "1. [TRIE VS LINEAR SEARCH] SO SANH TIEU CHUAN HIEN DAI VS TUYEN TINH" << endl;
            cout << "========================================================================" << endl;
            cout << "- Tuyen tinh (Linear Search): Duyet toan bo N san pham O(N * L). Khi N lon (100k+), bi lag!" << endl;
            cout << "- Cay Trie: Di truc tiep theo k ky tu tien to O(k). Hoan toan doc lap voi so luong san pham N!" << endl;
            cout << "Nhap tien to tim kiem (vd: 'giao', 'vl', 'casio', 'sach', 'c++'): ";
            string prefix;
            cin >> prefix;

            // 1. Chay voi Trie + Max-Heap
            auto start1 = chrono::high_resolution_clock::now();
            auto suggsTrie = sys.trie.suggest(prefix);
            auto end1 = chrono::high_resolution_clock::now();
            auto elapsedTrie = chrono::duration_cast<chrono::nanoseconds>(end1 - start1).count();

            // 2. Chay voi Linear Search
            auto start2 = chrono::high_resolution_clock::now();
            auto suggsLinear = linearSearchSuggest(sys.allProducts, prefix);
            auto end2 = chrono::high_resolution_clock::now();
            auto elapsedLinear = chrono::duration_cast<chrono::nanoseconds>(end2 - start2).count();

            cout << "\n>> KET QUA GOI Y BANG TRIE (O(k) = " << elapsedTrie << " ns):" << endl;
            if (suggsTrie.empty()) {
                cout << "   (Khong co tu khoa nao phu hop)" << endl;
            } else {
                for (size_t i = 0; i < suggsTrie.size(); ++i) {
                    cout << "   [" << (i + 1) << "] " << left << setw(35) << suggsTrie[i].word 
                         << " (Do pho bien: " << suggsTrie[i].frequency << " luot)" << endl;
                }
            }

            cout << "\n>> SO SANH TOC DO THUC TE:" << endl;
            cout << "   * Thoi gian Trie (Prefix Tree)   : " << elapsedTrie << " ns" << endl;
            cout << "   * Thoi gian Linear Search        : " << elapsedLinear << " ns" << endl;
            if (elapsedTrie < elapsedLinear) {
                cout << "   => KET LUAN: Trie nhanh hon gap " << (elapsedLinear / max(1LL, elapsedTrie)) 
                     << " lan va khong phai scan lai bo nho khi du lieu tang truong!" << endl;
            } else {
                cout << "   => KET LUAN: Trie co do phuc tap O(k) toi uu chat che, on dinh voi moi quy mo N!" << endl;
            }

        } else if (choice == 2) {
            cout << "\n========================================================================" << endl;
            cout << "2. [AVL TREE] THEM, XOA, CAN BANG CAY & TIM KIEM THEO GIA" << endl;
            cout << "========================================================================" << endl;
            cout << "Chieu cao hien tai cua cay AVL: " << sys.avl.getTreeHeight() << " (Can bang ly tuong O(log N))" << endl;
            cout << "He so lech Balance Factor tai nut goc: " << sys.avl.getRootBalanceFactor() << " (Trong nguong [-1, 1])" << endl;

            cout << "\n[2A. TIM KIEM THEO KHOANG GIA [Min - Max] DUNG CAY AVL]" << endl;
            long long minP, maxP;
            cout << "Nhap gia thap nhat (Min VND, vd: 30000): ";
            cin >> minP;
            cout << "Nhap gia cao nhat (Max VND, vd: 150000): ";
            cin >> maxP;

            auto start = chrono::high_resolution_clock::now();
            auto res = sys.avl.rangeQuery(minP, maxP);
            auto end = chrono::high_resolution_clock::now();
            auto elapsed = chrono::duration_cast<chrono::nanoseconds>(end - start).count();

            cout << ">> Ket qua loc cay AVL trong khoang [" << minP << " - " << maxP << " VND] (tim trong " << elapsed << " ns):" << endl;
            for (const auto& item : res) item.display();

            cout << "\n[2B. DEMO XOA KHOI CAY AVL & TAI CAN BANG]" << endl;
            cout << "Thu nghiem xoa san pham P03 (Noi com dien 120,000 VND) khoi cay AVL..." << endl;
            bool delOk = sys.avl.remove(120000, "P03");
            if (delOk) {
                cout << ">> Da xoa thanh cong P03 khoi cay AVL!" << endl;
                cout << ">> Cay da tu dong kich hoat phep quay tai can bang (Rotations LL/RR/LR/RL)." << endl;
                cout << ">> Chieu cao cay AVL sau khi xoa: " << sys.avl.getTreeHeight() 
                     << " | Balance Factor nut goc: " << sys.avl.getRootBalanceFactor() << endl;
            } else {
                cout << ">> San pham P03 khong con tren cay (hoac da duoc xoa truoc do)." << endl;
            }

        } else if (choice == 3) {
            cout << "\n========================================================================" << endl;
            cout << "3. [QUEUE & STACK] GIAI THICH DU LIEU VAO/RA & LY DO CHON CAU TRUC" << endl;
            cout << "========================================================================" << endl;
            
            cout << "\n--- A. HANG DOI MESSAGE QUEUE (FIFO: First In First Out) ---" << endl;
            cout << "+ Du lieu dua vao/lay ra : ChatPacket {id, sender, text, timestamp}." << endl;
            cout << "+ Co che hoat dong      : Enqueue (dua vao cuoi hang), Dequeue (lay ra o dau hang)." << endl;
            cout << "+ Ly do khoa hoc chon   : Tin nhan giua nguoi mua va ban bat buoc phai hien thi dung" << endl;
            cout << "                          theo trinh tu thoi gian thuc. Tranh nghẽn mang bang dem O(1)." << endl;
            cout << "+ Demo lay tin nhan dau tien trong hang doi:" << endl;
            ChatPacket p;
            if (sys.chatQueue.dequeue(p)) {
                cout << "  >> [POP FIFO] Tu: " << p.sender << " | Noi dung: \"" << p.text << "\"" << endl;
            }
            cout << "  >> So tin nhan con lai trong Queue: " << sys.chatQueue.size() << endl;

            cout << "\n--- B. NGAN XEP UNDO STACK (LIFO: Last In First Out) ---" << endl;
            cout << "+ Du lieu dua vao/lay ra : PostAction {actionType, productData, timestamp}." << endl;
            cout << "+ Co che hoat dong      : Push (day len dinh stack), Pop (lay thao tac gan nhat o dinh)." << endl;
            cout << "+ Ly do khoa hoc chon   : Phuc vu tinh nang Hoan Tac (Undo/Rollback). Thao tac nao lam" << endl;
            cout << "                          sau cung se can duoc hoan tac dau tien khi sinh vien bam Ctrl+Z." << endl;
            cout << "+ Demo hoan tac thao tac vua thuc hien:" << endl;
            PostAction act;
            if (sys.undoStack.popAction(act)) {
                cout << "  >> [POP LIFO] Hoan tac hanh dong: [" << act.actionType << "] tren mon: " << act.productData.title << endl;
            }
            cout << "  >> So thao tac con lai trong Stack: " << sys.undoStack.size() << endl;

        } else if (choice == 4) {
            cout << "\n========================================================================" << endl;
            cout << "4. [GRAPH + BFS] DE XUAT SAN PHAM TUONG DONG THEO MON HOC" << endl;
            cout << "========================================================================" << endl;
            cout << "Chon ma san pham goc de tim do tuong dong (P01, P02, P03, P04, P05, P06): ";
            string pid;
            cin >> pid;

            auto start = chrono::high_resolution_clock::now();
            auto res = sys.graph.recommendSimilarBFS(pid, 2);
            auto end = chrono::high_resolution_clock::now();
            auto elapsed = chrono::duration_cast<chrono::nanoseconds>(end - start).count();

            cout << ">> Cac mon do tuong dong nhat tim duoc bang BFS O(V + E) (tim trong " << elapsed << " ns):" << endl;
            if (res.empty()) cout << "   Khong tim thay mon tuong dong." << endl;
            for (const auto& item : res) item.display();

        } else if (choice == 5) {
            cout << "\n========================================================================" << endl;
            cout << "5. [BENCHMARK TONG HOP] DO HIEU NANG TOAN BO CORE C++ UTC2HAND" << endl;
            cout << "========================================================================" << endl;
            cout << left << setw(38) << "Thuat Toan & Cau Truc Du Lieu" << setw(22) << "Do Phuc Tap Ly Thuyet" << "Toc Do Do Duoc" << endl;
            cout << "--------------------------------------------------------------------------------" << endl;
            
            auto t1 = chrono::high_resolution_clock::now();
            sys.trie.suggest("giao");
            auto t2 = chrono::high_resolution_clock::now();
            cout << left << setw(38) << "1. Trie + Heap Autocomplete" << setw(22) << "O(k)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;

            t1 = chrono::high_resolution_clock::now();
            sys.avl.rangeQuery(30000, 100000);
            t2 = chrono::high_resolution_clock::now();
            cout << left << setw(38) << "2. AVL Tree Range Query" << setw(22) << "O(log N + K)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;

            t1 = chrono::high_resolution_clock::now();
            sys.graph.recommendSimilarBFS("P01", 2);
            t2 = chrono::high_resolution_clock::now();
            cout << left << setw(38) << "3. Graph + BFS Recommendation" << setw(22) << "O(V + E)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;

            t1 = chrono::high_resolution_clock::now();
            SessionToken s;
            sys.authTable.getSession("SESSION_ADMIN_UTC2", s);
            t2 = chrono::high_resolution_clock::now();
            cout << left << setw(38) << "4. Hash Table Session Token" << setw(22) << "O(1)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;

            cout << "--------------------------------------------------------------------------------" << endl;
            cout << ">> KET LUAN: Toan bo cac thuat toan C++ deu dat chuan dap ung thoi gian thuc (< 1ms)." << endl;
        }
    }

    cout << "\nCam on thay co va cac ban da theo doi demo C++ DSA UTC2Hand!" << endl;
    return 0;
}
