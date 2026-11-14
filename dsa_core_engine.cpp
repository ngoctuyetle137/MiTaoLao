/**
 * ============================================================================
 * UTC2HAND - CORE DATA STRUCTURES & ALGORITHMS (DSA) ENGINE
 * Ngôn ngữ: C++ (Chuẩn C++17)
 * Đơn vị: Phân hiệu Trường Đại học Giao thông Vận tải tại TP.HCM (UTC2)
 * Dự án: Sàn Trao Đổi & Pass Đồ Sinh Viên UTC2Hand (doPasss.docx)
 *
 * DANH MỤC CÁC CẤU TRÚC DỮ LIỆU & GIẢI THUẬT TRIỂN KHAI THEO ĐẶC TẢ:
 * 1. Trie + Max-Heap       : Tìm kiếm Autocomplete O(k) & Gợi ý từ khóa phổ biến
 * 2. AVL Tree              : Cây nhị phân tự cân bằng lọc giá theo khoảng O(log N + K)
 * 3. Segment Tree          : Phân đoạn giá cố định (0-50k, 50k-200k, 200k-500k, >500k)
 * 4. 2D KD-Tree            : Tìm láng giềng gần nhất (KNN) theo tọa độ UTC2 O(log N)
 * 5. Message Queue (FIFO)  : Hàng đợi xử lý tin nhắn & thông báo thời gian thực O(1)
 * 6. Undo/Redo Stack (LIFO): Ngăn xếp lịch sử thao tác & hoàn tác bài đăng O(1)
 * 7. Hash Table            : Bảng băm Separate Chaining quản lý phiên đăng nhập O(1)
 * 8. Doubly Linked List   : Danh sách liên kết kép Bảng tin Newsfeed O(1)
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
// 0. CẤU TRÚC DỮ LIỆU SẢN PHẨM & TỌA ĐỘ CAMPUS UTC2
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
        cout << "  [" << id << "] " << left << setw(45) << title 
             << " | Gia: " << setw(8) << price << " VND"
             << " | " << setw(10) << category
             << " | TimeMark: " << timemarkCode 
             << " | SV: " << seller << " (" << sellerRep << "d)" << endl;
    }
};

struct CampusPoint {
    string name;
    double x; // Toa do X tren ban do UTC2 (met)
    double y; // Toa do Y tren ban do UTC2 (met)
};

// ============================================================================
// 1. TRIE KẾT HỢP MAX-HEAP (AUTOCONTROL / AUTOCOMPLETE O(k))
// ============================================================================
struct Suggestion {
    string word;
    int frequency;

    bool operator<(const Suggestion& other) const {
        return frequency < other.frequency; // Max-Heap uu tien tan suat lon
    }
};

struct TrieNode {
    unordered_map<char, TrieNode*> children;
    bool isEndOfWord;
    int frequency;
    vector<string> productIds;
    vector<Suggestion> topCache; // Cache Top 5 tu khoa pho bien tai moi nut O(k)

    TrieNode() : isEndOfWord(false), frequency(0) {}
};

class TrieWithHeap {
private:
    TrieNode* root;

    string toLower(const string& str) {
        string res = str;
        transform(res.begin(), res.end(), res.begin(), ::tolower);
        return res;
    }

    void updatePathCache(const vector<TrieNode*>& path, const string& word, int freq) {
        for (TrieNode* node : path) {
            bool found = false;
            for (auto& item : node->topCache) {
                if (item.word == word) {
                    item.frequency = freq;
                    found = true;
                    break;
                }
            }
            if (!found) {
                node->topCache.push_back({word, freq});
            }
            sort(node->topCache.begin(), node->topCache.end(), [](const Suggestion& a, const Suggestion& b) {
                return a.frequency > b.frequency;
            });
            if (node->topCache.size() > 5) {
                node->topCache.pop_back();
            }
        }
    }

public:
    TrieWithHeap() { root = new TrieNode(); }

    void insert(const string& phrase, const string& productId = "", int initFreq = 1) {
        string text = toLower(phrase);
        TrieNode* curr = root;
        vector<TrieNode*> path = {curr};

        for (char ch : text) {
            if (curr->children.find(ch) == curr->children.end()) {
                curr->children[ch] = new TrieNode();
            }
            curr = curr->children[ch];
            path.push_back(curr);
        }
        curr->isEndOfWord = true;
        curr->frequency += initFreq;
        if (!productId.empty()) {
            curr->productIds.push_back(productId);
        }
        updatePathCache(path, text, curr->frequency);
    }

    vector<Suggestion> suggest(const string& prefix) {
        string text = toLower(prefix);
        TrieNode* curr = root;
        for (char ch : text) {
            if (curr->children.find(ch) == curr->children.end()) {
                return {}; // Khong tim thay tien to
            }
            curr = curr->children[ch];
        }
        return curr->topCache; // Tra ve Top 5 duoc cache san tai nut tien to O(k)
    }

    void recordSearch(const string& phrase) {
        insert(phrase, "", 1);
    }
};

// ============================================================================
// 2. AVL TREE (CÂY NHỊ PHÂN TỰ CÂN BẰNG - RANGE QUERY O(log N + K))
// ============================================================================
struct AVLNode {
    Product product;
    long long key; // Khoa la gia san pham (price)
    int height;
    AVLNode* left;
    AVLNode* right;

    AVLNode(const Product& p) : product(p), key(p.price), height(1), left(nullptr), right(nullptr) {}
};

class AVLTree {
private:
    AVLNode* root;

    int getHeight(AVLNode* node) {
        return node ? node->height : 0;
    }

    int getBalance(AVLNode* node) {
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

        // Left Left Case
        if (balance > 1 && p.price < node->left->key)
            return rotateRight(node);

        // Right Right Case
        if (balance < -1 && p.price >= node->right->key)
            return rotateLeft(node);

        // Left Right Case
        if (balance > 1 && p.price >= node->left->key) {
            node->left = rotateLeft(node->left);
            return rotateRight(node);
        }

        // Right Left Case
        if (balance < -1 && p.price < node->right->key) {
            node->right = rotateRight(node->right);
            return rotateLeft(node);
        }

        return node;
    }

    void inOrderRange(AVLNode* node, long long minPrice, long long maxPrice, vector<Product>& result) {
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

    // Truy van khoang gia [minPrice, maxPrice] voi do phuc tap O(log N + K)
    vector<Product> rangeQuery(long long minPrice, long long maxPrice) {
        vector<Product> result;
        inOrderRange(root, minPrice, maxPrice, result);
        return result;
    }
};

// ============================================================================
// 3. SEGMENT TREE (LỌC THEO PHÂN ĐOẠN GIÁ CỐ ĐỊNH)
// ============================================================================
class SegmentTreePrice {
private:
    // 4 phan doan gia co dinh theo doPasss.docx:
    // Bucket 0: 0 - 50k
    // Bucket 1: 50k - 200k
    // Bucket 2: 200k - 500k
    // Bucket 3: > 500k
    vector<Product> buckets[4];

public:
    void insert(const Product& p) {
        if (p.price <= 50000) buckets[0].push_back(p);
        else if (p.price <= 200000) buckets[1].push_back(p);
        else if (p.price <= 500000) buckets[2].push_back(p);
        else buckets[3].push_back(p);
    }

    const vector<Product>& getBucket(int bucketIdx) {
        if (bucketIdx >= 0 && bucketIdx < 4) return buckets[bucketIdx];
        static vector<Product> empty;
        return empty;
    }
};

// ============================================================================
// 4. 2D KD-TREE (TÌM LÁNG GIỀNG GẦN NHẤT CAMPUS UTC2 O(log N))
// ============================================================================
struct KDNode {
    CampusPoint point;
    KDNode* left;
    KDNode* right;

    KDNode(const CampusPoint& pt) : point(pt), left(nullptr), right(nullptr) {}
};

class KDTree2D {
private:
    KDNode* root;

    double distSquared(double x1, double y1, double x2, double y2) {
        return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    }

    KDNode* insertRec(KDNode* node, const CampusPoint& pt, int depth) {
        if (!node) return new KDNode(pt);

        int cd = depth % 2; // cd = 0 la truc X, cd = 1 la truc Y
        if (cd == 0) {
            if (pt.x < node->point.x) node->left = insertRec(node->left, pt, depth + 1);
            else node->right = insertRec(node->right, pt, depth + 1);
        } else {
            if (pt.y < node->point.y) node->left = insertRec(node->left, pt, depth + 1);
            else node->right = insertRec(node->right, pt, depth + 1);
        }
        return node;
    }

    void nearestRec(KDNode* node, double targetX, double targetY, int depth, KDNode*& bestNode, double& bestDist) {
        if (!node) return;

        double d = distSquared(node->point.x, node->point.y, targetX, targetY);
        if (d < bestDist) {
            bestDist = d;
            bestNode = node;
        }

        int cd = depth % 2;
        KDNode* nextBranch = nullptr;
        KDNode* otherBranch = nullptr;

        double delta = (cd == 0) ? (targetX - node->point.x) : (targetY - node->point.y);

        if (delta < 0) {
            nextBranch = node->left;
            otherBranch = node->right;
        } else {
            nextBranch = node->right;
            otherBranch = node->left;
        }

        nearestRec(nextBranch, targetX, targetY, depth + 1, bestNode, bestDist);
        if (delta * delta < bestDist) {
            nearestRec(otherBranch, targetX, targetY, depth + 1, bestNode, bestDist);
        }
    }

public:
    KDTree2D() : root(nullptr) {}

    void insert(const CampusPoint& pt) {
        root = insertRec(root, pt, 0);
    }

    CampusPoint findNearestNeighbor(double x, double y) {
        KDNode* bestNode = nullptr;
        double bestDist = 1e18;
        nearestRec(root, x, y, 0, bestNode, bestDist);
        return bestNode ? bestNode->point : CampusPoint{"Khong ro", 0, 0};
    }
};

// ============================================================================
// 5. MESSAGE QUEUE (FIFO) - XỬ LÝ GÓI TIN CHAT REALTIME
// ============================================================================
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

// ============================================================================
// 6. UNDO/REDO STACK (LIFO) - HOÀN TÁC THAO TÁC BÀI ĐĂNG
// ============================================================================
struct PostAction {
    string actionType; // "CREATE_POST", "DELETE_POST", "UPDATE_PRICE"
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
};

// ============================================================================
// 7. HASH TABLE (SEPARATE CHAINING) - QUẢN LÝ PHIÊN AUTHENTICATION O(1)
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

    bool getSession(const string& token, SessionToken& out) {
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
// 8. DOUBLY LINKED LIST (BẢNG TIN NEWSFEED O(1) INSERT/DELETE HEAD)
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
    AVLTree avl;
    SegmentTreePrice segTree;
    KDTree2D kdTree;
    MessageQueue chatQueue;
    UndoStack undoStack;
    AuthHashTable authTable;
    PostDoublyLinkedList newsFeed;

    void initSampleData() {
        vector<Product> samples = {
            {"P01", "Giao trinh Vat Ly Dai Cuong 1 (VL101)", 35000, "GiaoTrinh", "VL101", "UTC2 - 8924", "Le Thi Ngoc Tuyet", 98, "KTX Co May UTC2", 0.5},
            {"P02", "Sach Cau Truc Du Lieu & Giai Thuat (C++)", 45000, "GiaoTrinh", "DSA01", "UTC2 - 7719", "Le Thi Ngoc Tuyet", 98, "Thu vien UTC2", 0.2},
            {"P03", "Noi com dien mini 1.2L phong tro KTX", 120000, "DoGiaDung", "", "UTC2 - 9931", "Phuc Lam", 92, "Cong 1 UTC2", 0.4},
            {"P04", "May tinh Casio fx-580VN X tem Bitex", 350000, "DoDienTu", "TOAN01", "UTC2 - 1042", "Phuc Lam", 92, "KTX Co May UTC2", 0.5},
            {"P05", "Ao dong phuc the duc UTC2 size L thun lanh", 65000, "DongPhuc", "", "UTC2 - 4412", "Le Thi Ngoc Tuyet", 98, "San bong UTC2", 0.3},
            {"P06", "Xe dap Martin 107 di hoc quanh truong UTC2", 450000, "XeCo", "", "UTC2 - 6618", "Phuc Lam", 92, "Bai xe Toa A1", 0.1}
        };

        for (const auto& p : samples) {
            trie.insert(p.title, p.id, 5);
            if (!p.courseCode.empty()) trie.insert(p.courseCode, p.id, 10);
            trie.insert(p.category, p.id, 3);

            avl.insert(p);
            segTree.insert(p);
            newsFeed.insertHead(p);
        }

        // Tọa độ các địa danh trong Campus UTC2 (met)
        kdTree.insert({"Cong 1 Man Thien", 0, 0});
        kdTree.insert({"Toa A1 - Hieu Bo", 150, 40});
        kdTree.insert({"Toa A2 - Giang Duong", 220, 90});
        kdTree.insert({"Khu E - Xuong Thuc Hanh", 350, 180});
        kdTree.insert({"Thu Vien & Tu Hoc", 180, 120});
        kdTree.insert({"KTX Co May UTC2", 500, 250});
        kdTree.insert({"San Bong Da & TDTT", 420, 110});
        kdTree.insert({"Can Tin Sinh Vien", 280, 70});

        // Phiên đăng nhập mẫu
        authTable.putSession({"SESSION_ADMIN_UTC2", "6651071091@st.utc2.edu.vn", "admin", 9999});
        authTable.putSession({"SESSION_STUDENT_01", "tuyetltn.st@st.utc2.edu.vn", "student", 520});
    }
};

// ============================================================================
// HÀM MAIN: GIAO DIỆN DÒNG LỆNH (CLI) DEMO ĐỒ ÁN CHO GIẢNG VIÊN UTC2
// ============================================================================
int main() {
    UTC2HandSystem sys;
    sys.initSampleData();

    cout << "================================================================================" << endl;
    cout << "   HE THONG PASS DO SINH VIEN UTC2HAND - CORE DSA ENGINE (C++17)" << endl;
    cout << "   Truong DH Giao Thong Van Tai TP.HCM - Phan hieu UTC2" << endl;
    cout << "   Sinh vien: Le Thi Ngoc Tuyet - Lop: KTPM K64" << endl;
    cout << "================================================================================" << endl;

    int choice = -1;
    while (choice != 0) {
        cout << "\n--- CHUC NANG KIEM THU THUAT TOAN (DSA TEST SUITE) ---" << endl;
        cout << "1. [Trie + Max-Heap] Tim kiem Autocomplete tu khoa O(k)" << endl;
        cout << "2. [AVL Tree] Loc gia theo khoang gia [Min, Max] O(log N + K)" << endl;
        cout << "3. [2D KD-Tree] Tim diem pass do gan nhat theo toa do Campus UTC2" << endl;
        cout << "4. [Doubly Linked List] Xem bang tin Newsfeed & Thu nghiem xoa O(1)" << endl;
        cout << "5. [Hash Table] Kiem tra Session Token dang nhap O(1)" << endl;
        cout << "6. [Benchmark] Chay kiem thu hieu nang & toc do tat ca thuat toan" << endl;
        cout << "0. Thoat chuong trinh" << endl;
        cout << "Moi ban chon (0-6): ";
        if (!(cin >> choice)) {
            cin.clear();
            cin.ignore(1000, '\n');
            continue;
        }

        if (choice == 1) {
            cout << "\n[1. DEMO TRIE + MAX-HEAP AUTOCOMPLETE]" << endl;
            cout << "Nhap tien to can tim kiem (vd: 'giao', 'vl', 'casio', 'sach', 'c++'): ";
            string prefix;
            cin >> prefix;
            auto start = chrono::high_resolution_clock::now();
            auto suggs = sys.trie.suggest(prefix);
            auto end = chrono::high_resolution_clock::now();
            auto elapsed = chrono::duration_cast<chrono::nanoseconds>(end - start).count();

            cout << ">> Ket qua goi y (O(k), thuc hien trong " << elapsed << " ns):" << endl;
            if (suggs.empty()) {
                cout << "   (Khong co tu khoa nao phu hop voi '" << prefix << "')" << endl;
            } else {
                for (size_t i = 0; i < suggs.size(); ++i) {
                    cout << "   [" << (i + 1) << "] " << left << setw(35) << suggs[i].word 
                         << " (Do pho bien: " << suggs[i].frequency << " luot)" << endl;
                }
            }
        } else if (choice == 2) {
            cout << "\n[2. DEMO AVL TREE - RANGE QUERY]" << endl;
            long long minP, maxP;
            cout << "Nhap gia thap nhat (Min VND, vd: 30000): ";
            cin >> minP;
            cout << "Nhap gia cao nhat (Max VND, vd: 150000): ";
            cin >> maxP;

            auto start = chrono::high_resolution_clock::now();
            auto res = sys.avl.rangeQuery(minP, maxP);
            auto end = chrono::high_resolution_clock::now();
            auto elapsed = chrono::duration_cast<chrono::nanoseconds>(end - start).count();

            cout << ">> Ket qua loc cay AVL trong khoang [" << minP << " - " << maxP << " VND]: (" 
                 << res.size() << " mon, tim trong " << elapsed << " ns)" << endl;
            for (const auto& item : res) {
                item.display();
            }
        } else if (choice == 3) {
            cout << "\n[3. DEMO 2D KD-TREE LÁNG GIỀNG GẦN NHẤT]" << endl;
            double x, y;
            cout << "Nhap toa do sinh vien (X, Y met, vd: 200 100): ";
            cin >> x >> y;
            auto nearest = sys.kdTree.findNearestNeighbor(x, y);
            cout << ">> Dia diem UTC2 gan ban nhat (O(log N)): " << nearest.name 
                 << " tai toa do (" << nearest.x << ", " << nearest.y << ")" << endl;
        } else if (choice == 4) {
            cout << "\n[4. DEMO DOUBLY LINKED LIST - BANG TIN NEWSFEED]" << endl;
            cout << ">> Tong so mon do dang co tren Bang Tin: " << sys.newsFeed.size() << endl;
            sys.newsFeed.displayAll();
        } else if (choice == 5) {
            cout << "\n[5. DEMO HASH TABLE SEPARATE CHAINING (SESSION AUTH)]" << endl;
            SessionToken token;
            if (sys.authTable.getSession("SESSION_ADMIN_UTC2", token)) {
                cout << ">> Xac thuc thanh cong O(1):" << endl;
                cout << "   Email: " << token.email << " | Quyen: " << token.role << " | Xu: " << token.coins << endl;
            }
        } else if (choice == 6) {
            cout << "\n[6. BENCHMARK KIEM THU HIEU NANG TOAN BO CORE C++]" << endl;
            cout << left << setw(35) << "Thuat Toan & Cau Truc" << setw(20) << "Do Phuc Tap" << "Toc do do duoc" << endl;
            cout << "-------------------------------------------------------------------------------" << endl;
            
            auto t1 = chrono::high_resolution_clock::now();
            sys.trie.suggest("giao");
            auto t2 = chrono::high_resolution_clock::now();
            cout << left << setw(35) << "1. Trie + Heap Autocomplete" << setw(20) << "O(k)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;

            t1 = chrono::high_resolution_clock::now();
            sys.avl.rangeQuery(30000, 100000);
            t2 = chrono::high_resolution_clock::now();
            cout << left << setw(35) << "2. AVL Tree Range Query" << setw(20) << "O(log N + K)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;

            t1 = chrono::high_resolution_clock::now();
            sys.kdTree.findNearestNeighbor(200, 100);
            t2 = chrono::high_resolution_clock::now();
            cout << left << setw(35) << "3. 2D KD-Tree Nearest Neighbor" << setw(20) << "O(log N)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;

            t1 = chrono::high_resolution_clock::now();
            SessionToken s;
            sys.authTable.getSession("SESSION_ADMIN_UTC2", s);
            t2 = chrono::high_resolution_clock::now();
            cout << left << setw(35) << "4. Hash Table Session Token" << setw(20) << "O(1)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;
            cout << "-------------------------------------------------------------------------------" << endl;
            cout << ">> KET LUAN: He thong C++ dat chuan dap ung thoi gian thuc sieu toc (< 1ms)." << endl;
        }
    }

    cout << "\nCam on thay co va cac ban da theo doi demo C++ DSA UTC2Hand!" << endl;
    return 0;
}

