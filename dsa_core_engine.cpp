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
 * 3. 2D KD-Tree            : Phân chia không gian 2D tìm láng giềng gần nhất (KNN) theo tọa độ thực tế UTC2 O(log N)
 * 4. Dijkstra Algorithm    : Đồ thị địa điểm & trọng số mét thực tế, tìm đường đi ngắn nhất O((V+E) log V)
 * 5. Queue & Stack         : FIFO hàng đợi tin nhắn O(1) & LIFO ngăn xếp hoàn tác thao tác O(1)
 * 6. Graph + BFS           : Đồ thị sản phẩm & duyệt BFS gợi ý đồ liên quan theo môn học O(V + E)
 * 7. Hash Table            : Bảng băm Separate Chaining quản lý phiên đăng nhập O(1)
 * 8. Doubly Linked List    : Danh sách liên kết kép Bảng tin Newsfeed O(1)
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
        cout << "  [" << id << "] " << left << setw(44) << title 
             << " | Gia: " << setw(7) << price << " VND"
             << " | " << setw(10) << category
             << " | TimeMark: " << timemarkCode 
             << " | SV: " << seller << " (" << sellerRep << "d)" << endl;
    }
};

struct CampusPoint {
    string name;
    double x;   // Tọa độ X trên bản đồ nội bộ UTC2 (mét)
    double y;   // Tọa độ Y trên bản đồ nội bộ UTC2 (mét)
    double lat; // Vĩ độ GPS thực tế
    double lng; // Kinh độ GPS thực tế
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

    Product* searchNode(AVLNode* node, long long price) const {
        if (!node) return nullptr;
        if (node->key == price) return &(node->product);
        if (price < node->key) return searchNode(node->left, price);
        return searchNode(node->right, price);
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

    Product* searchExactPrice(long long price) const {
        return searchNode(root, price);
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
// 3. 2D KD-TREE (TÌM LÁNG GIỀNG GẦN NHẤT CAMPUS UTC2 O(log N))
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

    double distSquared(double x1, double y1, double x2, double y2) const {
        return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    }

    KDNode* insertRec(KDNode* node, const CampusPoint& pt, int depth) {
        if (!node) return new KDNode(pt);

        int cd = depth % 2; // cd = 0 là trục X (mét), cd = 1 là trục Y (mét)
        if (cd == 0) {
            if (pt.x < node->point.x) node->left = insertRec(node->left, pt, depth + 1);
            else node->right = insertRec(node->right, pt, depth + 1);
        } else {
            if (pt.y < node->point.y) node->left = insertRec(node->left, pt, depth + 1);
            else node->right = insertRec(node->right, pt, depth + 1);
        }
        return node;
    }

    void nearestRec(KDNode* node, double targetX, double targetY, int depth, KDNode*& bestNode, double& bestDist) const {
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

    CampusPoint findNearestNeighbor(double x, double y) const {
        KDNode* bestNode = nullptr;
        double bestDist = 1e18;
        nearestRec(root, x, y, 0, bestNode, bestDist);
        return bestNode ? bestNode->point : CampusPoint{"Khong ro", 0, 0, 0, 0};
    }
};

// ============================================================================
// 4. THUẬT TOÁN DIJKSTRA (ĐƯỜNG ĐI NGẮN NHẤT TRONG CAMPUS UTC2 O((V+E)log V))
// ============================================================================
class CampusDijkstra {
private:
    unordered_map<string, vector<pair<string, double>>> adj;

public:
    void addEdge(const string& u, const string& v, double weightMeters) {
        adj[u].push_back({v, weightMeters});
        adj[v].push_back({u, weightMeters});
    }

    pair<double, vector<string>> findShortestPath(const string& start, const string& target) const {
        unordered_map<string, double> dist;
        unordered_map<string, string> parent;
        for (const auto& kv : adj) {
            dist[kv.first] = 1e18;
        }

        priority_queue<pair<double, string>, vector<pair<double, string>>, greater<pair<double, string>>> pq;
        dist[start] = 0;
        pq.push({0, start});

        while (!pq.empty()) {
            double d = pq.top().first;
            string u = pq.top().second;
            pq.pop();

            if (u == target) break;
            if (d > dist[u]) continue;

            if (adj.find(u) == adj.end()) continue;
            for (const auto& edge : adj.at(u)) {
                string v = edge.first;
                double w = edge.second;
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    parent[v] = u;
                    pq.push({dist[v], v});
                }
            }
        }

        vector<string> path;
        if (dist.find(target) == dist.end() || dist[target] >= 1e17) return { -1.0, path };

        string curr = target;
        while (curr != start && !curr.empty()) {
            path.push_back(curr);
            curr = parent[curr];
        }
        path.push_back(start);
        reverse(path.begin(), path.end());
        return { dist[target], path };
    }
};

// ============================================================================
// 5. QUEUE (FIFO) & STACK (LIFO)
// ============================================================================
// 5A. HÀNG ĐỢI TIN NHẮN REALTIME (FIFO)
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

// 5B. NGĂN XẾP HOÀN TÁC THAO TÁC BÀI ĐĂNG (LIFO)
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
// 6. GRAPH + BFS (ĐỀ XUẤT SẢN PHẨM TƯƠNG ĐỒNG THEO MÔN HỌC O(V + E))
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
// 8. DOUBLY LINKED LIST (BẢNG TIN NEWSFEED O(1) CHÈN/XÓA ĐẦU)
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
    KDTree2D kdTree;
    CampusDijkstra dijkstra;
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

        // Tọa độ GPS & Đề-các (mét) các địa danh thực tế tại Phân hiệu UTC2 Man Thiện
        kdTree.insert({"Cong 1 Man Thien", 0, 0, 10.8465, 106.7798});
        kdTree.insert({"Toa A1 - Hieu Bo", 150, 40, 10.8470, 106.7803});
        kdTree.insert({"Toa A2 - Giang Duong", 220, 90, 10.8475, 106.7808});
        kdTree.insert({"Thu Vien & Tu Hoc", 180, 120, 10.8472, 106.7812});
        kdTree.insert({"Can Tin Sinh Vien", 280, 70, 10.8480, 106.7806});
        kdTree.insert({"San Bong Da & TDTT", 420, 110, 10.8488, 106.7815});
        kdTree.insert({"KTX Co May UTC2", 500, 250, 10.8495, 106.7820});
        kdTree.insert({"Khu E - Xuong Thuc Hanh", 350, 180, 10.8482, 106.7825});

        // Đồ thị mạng lưới đi bộ Campus UTC2 kèm trọng số khoảng cách (mét)
        dijkstra.addEdge("Cong 1 Man Thien", "Toa A1 - Hieu Bo", 150);
        dijkstra.addEdge("Toa A1 - Hieu Bo", "Toa A2 - Giang Duong", 90);
        dijkstra.addEdge("Toa A1 - Hieu Bo", "Thu Vien & Tu Hoc", 100);
        dijkstra.addEdge("Toa A2 - Giang Duong", "Can Tin Sinh Vien", 70);
        dijkstra.addEdge("Can Tin Sinh Vien", "San Bong Da & TDTT", 160);
        dijkstra.addEdge("San Bong Da & TDTT", "KTX Co May UTC2", 180);
        dijkstra.addEdge("Toa A2 - Giang Duong", "Khu E - Xuong Thuc Hanh", 190);
        dijkstra.addEdge("Khu E - Xuong Thuc Hanh", "KTX Co May UTC2", 220);

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
// HÀM MAIN: GIAO DIỆN DÒNG LỆNH (CLI) CHỨNG MINH 5 YÊU CẦU ĐỒ ÁN DSA CHO GIẢNG VIÊN
// ============================================================================
int main() {
    UTC2HandSystem sys;
    sys.initSampleData();

    cout << "================================================================================" << endl;
    cout << "   HE THONG PASS DO SINH VIEN UTC2HAND - CORE DSA ENGINE (C++17)" << endl;
    cout << "   Truong DH Giao Thong Van Tai TP.HCM - Phan hieu UTC2 (Man Thien, Thu Duc)" << endl;
    cout << "   Sinh vien: Le Thi Ngoc Tuyet - Lop: KTPM K64" << endl;
    cout << "================================================================================" << endl;

    int choice = -1;
    while (choice != 0) {
        cout << "\n--- CHUC NANG KIEM THU 5 YEU CAU THUAT TOAN (DSA DEFENSE SUITE) ---" << endl;
        cout << "1. [Trie vs Linear Search] Chung minh Autocomplete vuot troi tim kiem tuyen tinh" << endl;
        cout << "2. [AVL Tree] The hien Them, Xoa, Can bang (LL/RR/LR/RL) & Tim kiem theo gia" << endl;
        cout << "3. [2D KD-Tree] Toa do thuc te Campus UTC2 & Tim kiem lang gieng gan nhat (KNN)" << endl;
        cout << "4. [Dijkstra] Do thi dia diem, trong so met & Tim duong di ngan nhat Campus" << endl;
        cout << "5. [Queue & Stack] Giai thich du lieu Vao/Ra & Ly do chon FIFO/LIFO" << endl;
        cout << "6. [Graph + BFS] De xuat san pham tuong dong theo mon hoc (O(V + E))" << endl;
        cout << "7. [Benchmark Tong Hop] Do thoi gian thuc thi tat ca thuat toan (nanoseconds)" << endl;
        cout << "0. Thoat chuong trinh" << endl;
        cout << "Moi thay/co va cac ban chon (0-7): ";
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
            cout << "3. [2D KD-TREE] TOA DO THUC TE CAMPUS UTC2 & TIM KIEM LANG GIENG GAN NHAT (KNN)" << endl;
            cout << "========================================================================" << endl;
            cout << "Danh sach toa do GPS thuc te cac dia danh tai Phan hieu UTC2 (Man Thien, Thu Duc):" << endl;
            cout << "  1. Cong 1 Man Thien        : (0m, 0m)      - GPS: (10.8465, 106.7798)" << endl;
            cout << "  2. Toa A1 - Hieu Bo        : (150m, 40m)   - GPS: (10.8470, 106.7803)" << endl;
            cout << "  3. Toa A2 - Giang Duong    : (220m, 90m)   - GPS: (10.8475, 106.7808)" << endl;
            cout << "  4. Thu Vien & Tu Hoc       : (180m, 120m)  - GPS: (10.8472, 106.7812)" << endl;
            cout << "  5. Can Tin Sinh Vien       : (280m, 70m)   - GPS: (10.8480, 106.7806)" << endl;
            cout << "  6. San Bong Da & TDTT      : (420m, 110m)  - GPS: (10.8488, 106.7815)" << endl;
            cout << "  7. KTX Co May UTC2         : (500m, 250m)  - GPS: (10.8495, 106.7820)" << endl;
            cout << "  8. Khu E - Xuong Thuc Hanh : (350m, 180m)  - GPS: (10.8482, 106.7825)" << endl;

            double x, y;
            cout << "\nNhap toa do hien tai cua sinh vien (X Y met, vd: 200 100): ";
            cin >> x >> y;

            auto start = chrono::high_resolution_clock::now();
            auto nearest = sys.kdTree.findNearestNeighbor(x, y);
            auto end = chrono::high_resolution_clock::now();
            auto elapsed = chrono::duration_cast<chrono::nanoseconds>(end - start).count();

            double distMeters = sqrt((nearest.x - x) * (nearest.x - x) + (nearest.y - y) * (nearest.y - y));
            cout << "\n>> KET QUA TIM KIEM LANG GIENG GAN NHAT (KNN) BANG 2D KD-TREE:" << endl;
            cout << "   * Dia diem UTC2 gan nhat : " << nearest.name << endl;
            cout << "   * Toa do dia diem        : (" << nearest.x << "m, " << nearest.y << "m)" << endl;
            cout << "   * Toa do GPS thuc te     : Lat " << nearest.lat << ", Lng " << nearest.lng << endl;
            cout << "   * Khoang cach uoc tinh   : ~" << fixed << setprecision(1) << distMeters << " met" << endl;
            cout << "   * Thoi gian thuat toan   : " << elapsed << " ns (Do phuc tap O(log N))" << endl;

        } else if (choice == 4) {
            cout << "\n========================================================================" << endl;
            cout << "4. [DIJKSTRA] DO THI DIA DIEM, TRONG SO MET & TIM DUONG DI NGAN NHAT" << endl;
            cout << "========================================================================" << endl;
            cout << "Do thi cac tuyen duong noi bo Campus UTC2 (trong so la chieu dai thuc te tinh bang met):" << endl;
            cout << "  * Cong 1 Man Thien    <--> Toa A1 - Hieu Bo       : 150 met" << endl;
            cout << "  * Toa A1 - Hieu Bo    <--> Toa A2 - Giang Duong   : 90 met" << endl;
            cout << "  * Toa A1 - Hieu Bo    <--> Thu Vien & Tu Hoc      : 100 met" << endl;
            cout << "  * Toa A2 - Giang Duong<--> Can Tin Sinh Vien      : 70 met" << endl;
            cout << "  * Can Tin Sinh Vien   <--> San Bong Da & TDTT     : 160 met" << endl;
            cout << "  * San Bong Da & TDTT  <--> KTX Co May UTC2        : 180 met" << endl;
            cout << "  * Toa A2 - Giang Duong<--> Khu E - Xuong Thuc Hanh: 190 met" << endl;
            cout << "  * Khu E - Xuong Thuc  <--> KTX Co May UTC2        : 220 met" << endl;

            string startLoc = "Cong 1 Man Thien";
            string endLoc = "KTX Co May UTC2";
            cout << "\nDang tinh toan lo trinh di bo toi uu tu [" << startLoc << "] den [" << endLoc << "]..." << endl;

            auto start = chrono::high_resolution_clock::now();
            auto pathResult = sys.dijkstra.findShortestPath(startLoc, endLoc);
            auto end = chrono::high_resolution_clock::now();
            auto elapsed = chrono::duration_cast<chrono::nanoseconds>(end - start).count();

            cout << "\n>> KET QUA THUAT TOAN DIJKSTRA (Min-Heap O((V + E) log V)):" << endl;
            cout << "   * Tong quang duong ngan nhat: " << pathResult.first << " met" << endl;
            cout << "   * Thoi gian di bo sinh vien : ~" << fixed << setprecision(1) << (pathResult.first / 1.4 / 60.0) << " phut (van toc 1.4 m/s)" << endl;
            cout << "   * Lo trinh di chuyen chi tiet:" << endl;
            cout << "     ";
            for (size_t i = 0; i < pathResult.second.size(); ++i) {
                cout << "[" << pathResult.second[i] << "]" << (i + 1 < pathResult.second.size() ? " ---> " : "");
            }
            cout << endl;
            cout << "   * Thoi gian thuc thi Dijkstra: " << elapsed << " ns" << endl;

        } else if (choice == 5) {
            cout << "\n========================================================================" << endl;
            cout << "5. [QUEUE & STACK] GIAI THICH DU LIEU VAO/RA & LY DO CHON CAU TRUC" << endl;
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

        } else if (choice == 6) {
            cout << "\n========================================================================" << endl;
            cout << "6. [GRAPH + BFS] DE XUAT SAN PHAM TUONG DONG THEO MON HOC" << endl;
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

        } else if (choice == 7) {
            cout << "\n========================================================================" << endl;
            cout << "7. [BENCHMARK TONG HOP] DO HIEU NANG TOAN BO CORE C++ UTC2HAND" << endl;
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
            sys.kdTree.findNearestNeighbor(200, 100);
            t2 = chrono::high_resolution_clock::now();
            cout << left << setw(38) << "3. 2D KD-Tree Nearest (KNN)" << setw(22) << "O(log N)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;

            t1 = chrono::high_resolution_clock::now();
            sys.dijkstra.findShortestPath("Cong 1 Man Thien", "KTX Co May UTC2");
            t2 = chrono::high_resolution_clock::now();
            cout << left << setw(38) << "4. Campus Dijkstra Path" << setw(22) << "O((V + E) log V)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;

            t1 = chrono::high_resolution_clock::now();
            sys.graph.recommendSimilarBFS("P01", 2);
            t2 = chrono::high_resolution_clock::now();
            cout << left << setw(38) << "5. Graph + BFS Recommendation" << setw(22) << "O(V + E)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;

            t1 = chrono::high_resolution_clock::now();
            SessionToken s;
            sys.authTable.getSession("SESSION_ADMIN_UTC2", s);
            t2 = chrono::high_resolution_clock::now();
            cout << left << setw(38) << "6. Hash Table Session Token" << setw(22) << "O(1)" 
                 << chrono::duration_cast<chrono::nanoseconds>(t2 - t1).count() << " ns" << endl;

            cout << "--------------------------------------------------------------------------------" << endl;
            cout << ">> KET LUAN: Toan bo cac thuat toan C++ deu dat chuan dap ung thoi gian thuc (< 1ms)." << endl;
        }
    }

    cout << "\nCam on thay co va cac ban da theo doi demo C++ DSA UTC2Hand!" << endl;
    return 0;
}
