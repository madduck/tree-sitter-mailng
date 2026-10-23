use tree_sitter::{Node, Parser};

fn main() {
    let code = std::fs::read_to_string("examples/example.mail").expect("read example mail");

    let mut parser = Parser::new();
    parser
        .set_language(&tree_sitter_mailng::LANGUAGE.into())
        .expect("load the Mail NG grammar");

    let tree = parser.parse(&code, None).expect("parse the example mail");
    print_tree(tree.root_node(), &code, 0);
}

fn print_tree(node: Node, source: &str, depth: usize) {
    let text = if node.child_count() == 0 {
        format!(" {:?}", &source[node.byte_range()])
    } else {
        String::new()
    };
    println!("{}{}{}", "  ".repeat(depth), node.kind(), text);
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        print_tree(child, source, depth + 1);
    }
}
